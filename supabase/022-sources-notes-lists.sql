-- 022: sumber pengunjung (F1), jam ramai (F10), catatan produk (F3), daftar produk per video (F6),
-- catatan affiliate (F12), ringkasan mingguan lewat email (F9).
-- Aman dijalankan ulang (idempotent). Jalankan di produksi hanya dengan OK owner.

-- 1. Sumber kunjungan dan klik. Hanya kategori sumbernya yang disimpan (bukan URL referrer, IP atau user agent).
alter table public.page_views add column if not exists source text;
alter table public.link_clicks add column if not exists source text;
alter table public.product_clicks add column if not exists source text;

create or replace function public.clean_source(p_source text)
returns text language sql immutable set search_path = '' as $$
  select case when p_source in ('instagram', 'tiktok', 'whatsapp', 'facebook', 'youtube', 'x', 'threads', 'telegram', 'google', 'other', 'direct')
    then p_source end;
$$;
revoke all on function public.clean_source(text) from public, anon, authenticated;

-- Fungsi lama dihapus dulu: versi baru punya parameter tambahan dengan default, jadi pemanggilan lama
-- (tanpa sumber) tetap jalan, tapi dua versi sekaligus membuat pemanggilan jadi ambigu.
drop function if exists public.record_page_view(uuid, text);
create or replace function public.record_page_view(p_linktree_id uuid, p_visitor_token text, p_source text default null)
returns void language sql security definer set search_path = '' as $$
  insert into public.page_views (profile_id, linktree_id, visitor_hash, source)
  select owner_id, id, encode(extensions.digest(p_visitor_token, 'sha256'), 'hex'), public.clean_source(p_source)
  from public.linktrees where id = p_linktree_id
  on conflict do nothing;
$$;

drop function if exists public.record_link_click(uuid);
create or replace function public.record_link_click(p_link_id uuid, p_source text default null)
returns text language plpgsql security definer set search_path = '' as $$
declare destination text;
begin
  select url into destination from public.links where id = p_link_id and is_active = true;
  if destination is null then return null; end if;
  insert into public.link_clicks (link_id, profile_id, linktree_id, source)
  select id, user_id, linktree_id, public.clean_source(p_source) from public.links where id = p_link_id;
  return destination;
end;
$$;

drop function if exists public.record_product_click(uuid);
create or replace function public.record_product_click(p_product_id uuid, p_source text default null)
returns text language plpgsql security definer set search_path = '' as $$
declare item record;
begin
  select id, linktree_id, platform, url into item from public.products
  where id = p_product_id and is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now());
  if not found then return null; end if;
  insert into public.product_clicks (product_id, linktree_id, platform, source) values (item.id, item.linktree_id, item.platform, public.clean_source(p_source));
  return item.url;
end;
$$;

revoke all on function public.record_page_view(uuid, text, text) from public, anon, authenticated;
revoke all on function public.record_link_click(uuid, text) from public, anon, authenticated;
revoke all on function public.record_product_click(uuid, text) from public, anon, authenticated;
grant execute on function public.record_page_view(uuid, text, text) to service_role;
grant execute on function public.record_link_click(uuid, text) to service_role;
grant execute on function public.record_product_click(uuid, text) to service_role;

-- 2. Insights: sama dengan 021, ditambah per sumber dan per jam (WIB).
create or replace function public.insights_summary(p_linktree_id uuid, p_from timestamptz, p_to timestamptz)
returns jsonb language sql stable security invoker set search_path = '' as $$
  with events as (
    select created_at at time zone 'Asia/Jakarta' as local, coalesce(source, 'direct') as source, 1 as views, 0 as clicks, 0 as buys
      from public.page_views where linktree_id = p_linktree_id and created_at between p_from and p_to
    union all
    select created_at at time zone 'Asia/Jakarta', coalesce(source, 'direct'), 0, 1, 0
      from public.link_clicks where linktree_id = p_linktree_id and created_at between p_from and p_to
    union all
    select created_at at time zone 'Asia/Jakarta', coalesce(source, 'direct'), 0, 0, 1
      from public.product_clicks where linktree_id = p_linktree_id and created_at between p_from and p_to
  )
  select jsonb_build_object(
    'days', coalesce((select jsonb_agg(jsonb_build_object('day', day, 'views', views, 'clicks', clicks, 'buys', buys) order by day)
      from (select local::date as day, sum(views)::int as views, sum(clicks)::int as clicks, sum(buys)::int as buys from events group by 1) d), '[]'::jsonb),
    'sources', coalesce((select jsonb_agg(jsonb_build_object('source', source, 'views', views, 'taps', taps) order by views desc, taps desc)
      from (select source, sum(views)::int as views, sum(clicks + buys)::int as taps from events group by source) s), '[]'::jsonb),
    'hours', coalesce((select jsonb_agg(jsonb_build_object('hour', hour, 'views', views, 'taps', taps) order by hour)
      from (select extract(hour from local)::int as hour, sum(views)::int as views, sum(clicks + buys)::int as taps from events group by 1) h), '[]'::jsonb),
    'links', coalesce((select jsonb_agg(jsonb_build_object('id', link_id, 'count', n) order by n desc)
      from (select link_id, count(*)::int as n from public.link_clicks
            where linktree_id = p_linktree_id and created_at between p_from and p_to group by link_id order by n desc limit 5) l), '[]'::jsonb),
    'products', coalesce((select jsonb_agg(jsonb_build_object('id', product_id, 'count', n) order by n desc)
      from (select product_id, count(*)::int as n from public.product_clicks
            where linktree_id = p_linktree_id and created_at between p_from and p_to group by product_id order by n desc limit 5) p), '[]'::jsonb),
    'stores', coalesce((select jsonb_agg(jsonb_build_object('platform', platform, 'count', n) order by n desc)
      from (select platform, count(*)::int as n from public.product_clicks
            where linktree_id = p_linktree_id and created_at between p_from and p_to group by platform) s), '[]'::jsonb)
  );
$$;
revoke all on function public.insights_summary(uuid, timestamptz, timestamptz) from public, anon;
grant execute on function public.insights_summary(uuid, timestamptz, timestamptz) to authenticated, service_role;

-- 3. Catatan singkat per produk ("kenapa aku suka ini"), tampil di kartu produk.
alter table public.products add column if not exists note text not null default '';
alter table public.products drop constraint if exists products_note_length;
alter table public.products add constraint products_note_length check (char_length(note) <= 140);

-- 4. Daftar produk per video ("Haul 12.12") dengan link sendiri: /slug/c/haul-1212.
create table if not exists public.product_lists (
  id uuid primary key default gen_random_uuid(),
  linktree_id uuid not null references public.linktrees(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 60),
  slug text not null check (slug ~ '^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$'),
  product_ids uuid[] not null default '{}' check (cardinality(product_ids) <= 60),
  created_at timestamptz not null default now(),
  unique (linktree_id, slug)
);
alter table public.product_lists enable row level security;
grant select on public.product_lists to anon, authenticated;
grant insert, update, delete on public.product_lists to authenticated;

drop policy if exists "Lists are public" on public.product_lists;
create policy "Lists are public" on public.product_lists for select using (true);
drop policy if exists "Owners manage lists" on public.product_lists;
create policy "Owners manage lists" on public.product_lists for all to authenticated
  using (public.owns_linktree(linktree_id))
  with check (public.owns_linktree(linktree_id) and user_id = auth.uid());
drop policy if exists "MFA required (insert)" on public.product_lists;
drop policy if exists "MFA required (update)" on public.product_lists;
drop policy if exists "MFA required (delete)" on public.product_lists;
create policy "MFA required (insert)" on public.product_lists as restrictive for insert to authenticated with check ((select public.mfa_ok()));
create policy "MFA required (update)" on public.product_lists as restrictive for update to authenticated using ((select public.mfa_ok())) with check ((select public.mfa_ok()));
create policy "MFA required (delete)" on public.product_lists as restrictive for delete to authenticated using ((select public.mfa_ok()));

-- 5. Catatan affiliate di bawah halaman ("Some links are affiliate links").
alter table public.linktrees add column if not exists affiliate_notice boolean not null default false;

-- 6. Ringkasan mingguan lewat email (opt-in, default mati).
alter table public.profiles add column if not exists weekly_email boolean not null default false;
grant update (weekly_email) on public.profiles to authenticated;

-- Cek sesudah dijalankan (hanya membaca): 3 kolom source, 4 fungsi, 1 tabel, 5 policy, 3 kolom baru.
-- select
--   (select count(*) from information_schema.columns where table_schema = 'public' and column_name = 'source' and table_name in ('page_views', 'link_clicks', 'product_clicks')) as source_columns,
--   (select count(*) from pg_proc where proname in ('clean_source', 'record_page_view', 'record_link_click', 'record_product_click')) as functions,
--   (select count(*) from pg_tables where schemaname = 'public' and tablename = 'product_lists') as list_table,
--   (select count(*) from pg_policies where tablename = 'product_lists') as list_policies,
--   (select count(*) from information_schema.columns where table_schema = 'public' and ((table_name = 'products' and column_name = 'note') or (table_name = 'linktrees' and column_name = 'affiliate_notice') or (table_name = 'profiles' and column_name = 'weekly_email'))) as new_columns;
