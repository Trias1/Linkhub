-- 021: nomor produk, Insights dihitung di database, batasan kolom halaman, MFA untuk data tersembunyi.
-- Sudah dijalankan di produksi 5 Nov 2026 dengan OK owner (cek: kolom number terisi 1,2; 2 fungsi, 1 trigger,
-- 5 constraint, 3 policy). Aman dijalankan ulang (idempotent).

-- 1. Nomor produk per halaman ("cek link di bio, nomor 12").
--    Nomor tetap: tidak berubah saat urutan diubah, dan nomor produk yang dihapus tidak dipakai ulang.
alter table public.products add column if not exists number integer;
-- Trigger dilepas dulu supaya pengisian nomor di bawah tidak dibatalkan trigger (kalau file dijalankan ulang).
drop trigger if exists set_product_number on public.products;

update public.products p set number = x.n
from (
  select p2.id, coalesce(m.top, 0) + row_number() over (partition by p2.linktree_id order by p2.created_at, p2.id) as n
  from public.products p2
  left join (select linktree_id, max(number) as top from public.products group by linktree_id) m using (linktree_id)
  where p2.number is null
) x
where p.id = x.id;

create unique index if not exists products_linktree_number_key on public.products (linktree_id, number);

-- Nomor selalu diisi database (nilai dari client diabaikan) dan tidak bisa diubah sesudahnya.
create or replace function public.set_product_number()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    new.number := old.number;
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtext(new.linktree_id::text));
  select coalesce(max(number), 0) + 1 into new.number from public.products where linktree_id = new.linktree_id;
  return new;
end $$;
revoke all on function public.set_product_number() from public, anon, authenticated;

create trigger set_product_number before insert or update of number on public.products
for each row execute function public.set_product_number();

-- 2. Insights: hitungan per hari WIB, top link/produk dan klik per toko, dihitung di database
--    (tidak lagi terpotong di 1000 baris). security invoker: RLS dan aturan MFA tetap berlaku.
create or replace function public.insights_summary(p_linktree_id uuid, p_from timestamptz, p_to timestamptz)
returns jsonb language sql stable security invoker set search_path = '' as $$
  with events as (
    select (created_at at time zone 'Asia/Jakarta')::date as day, 1 as views, 0 as clicks, 0 as buys
      from public.page_views where linktree_id = p_linktree_id and created_at between p_from and p_to
    union all
    select (created_at at time zone 'Asia/Jakarta')::date, 0, 1, 0
      from public.link_clicks where linktree_id = p_linktree_id and created_at between p_from and p_to
    union all
    select (created_at at time zone 'Asia/Jakarta')::date, 0, 0, 1
      from public.product_clicks where linktree_id = p_linktree_id and created_at between p_from and p_to
  )
  select jsonb_build_object(
    'days', coalesce((select jsonb_agg(jsonb_build_object('day', day, 'views', views, 'clicks', clicks, 'buys', buys) order by day)
      from (select day, sum(views)::int as views, sum(clicks)::int as clicks, sum(buys)::int as buys from events group by day) d), '[]'::jsonb),
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
grant execute on function public.insights_summary(uuid, timestamptz, timestamptz) to authenticated;

-- 3. Batasan kolom halaman, sama dengan validasi di aplikasi (API Supabase langsung tidak bisa melewatinya).
--    NOT VALID: hanya berlaku untuk tulisan baru; data lama sudah dicek dulu dengan query di bagian bawah.
alter table public.linktrees drop constraint if exists linktree_text_limits;
alter table public.linktrees add constraint linktree_text_limits check (
  char_length(coalesce(name, '')) <= 60 and char_length(coalesce(bio, '')) <= 160
  and char_length(coalesce(custom_footer, '')) <= 120
  and char_length(coalesce(seo_title, '')) <= 70 and char_length(coalesce(seo_description, '')) <= 160
) not valid;
alter table public.linktrees drop constraint if exists linktree_style_values;
alter table public.linktrees add constraint linktree_style_values check (
  title_style in ('normal', 'uppercase', 'italic', 'serif')
  and wallpaper_style in ('solid', 'gradient', 'soft')
  and button_style in ('solid', 'glass', 'outline')
  and button_roundness in ('square', 'soft', 'rounded', 'pill')
  and page_font in ('geist', 'inter', 'poppins', 'playfair', 'space', 'dm-sans', 'lora', 'merriweather', 'nunito', 'montserrat', 'bebas-neue', 'caveat')
) not valid;
alter table public.linktrees drop constraint if exists linktree_reserved_slug;
alter table public.linktrees add constraint linktree_reserved_slug check (
  slug is null or slug not in ('admin', 'api', 'auth', 'dashboard', 'login', 'signup', 'logout', 'forgot-password', 'reset-password',
    'privacy', 'terms', 'dev-preview', 'en', 'id', 'www', 'app', 'help', 'support', 'settings', 'account', 'linkhub', 'static', '_next')
) not valid;
alter table public.linktrees drop constraint if exists linktree_avatar_https;
alter table public.linktrees add constraint linktree_avatar_https check (
  avatar_url is null or (avatar_url ~ '^https://' and avatar_url !~ '[[:space:]"''()\\]' and char_length(avatar_url) <= 1000)
) not valid;
alter table public.products drop constraint if exists products_image_url_safe;
alter table public.products add constraint products_image_url_safe check (
  image_url is null or (image_url ~ '^https://' and image_url !~ '[[:space:]"''()\\]')
) not valid;

-- 4. MFA juga untuk membaca data tersembunyi milik sendiri (link/produk nonaktif, profil).
--    Halaman publik tidak terpengaruh: baris aktif tetap terbaca.
drop policy if exists "MFA required (hidden links)" on public.links;
create policy "MFA required (hidden links)" on public.links as restrictive for select to authenticated
  using (is_active or (select public.mfa_ok()));
drop policy if exists "MFA required (hidden products)" on public.products;
create policy "MFA required (hidden products)" on public.products as restrictive for select to authenticated
  using (is_active or (select public.mfa_ok()));
drop policy if exists "MFA required (select)" on public.profiles;
create policy "MFA required (select)" on public.profiles as restrictive for select to authenticated
  using ((select public.mfa_ok()));

-- Sebelum dijalankan (hanya membaca): semua angka harus 0, kalau tidak data lama perlu dirapikan dulu.
-- select
--   (select count(*) from public.linktrees where char_length(coalesce(name,'')) > 60 or char_length(coalesce(bio,'')) > 160
--      or char_length(coalesce(custom_footer,'')) > 120 or char_length(coalesce(seo_title,'')) > 70 or char_length(coalesce(seo_description,'')) > 160) as text_too_long,
--   (select count(*) from public.linktrees where title_style not in ('normal','uppercase','italic','serif') or wallpaper_style not in ('solid','gradient','soft')
--      or button_style not in ('solid','glass','outline') or button_roundness not in ('square','soft','rounded','pill')
--      or page_font not in ('geist','inter','poppins','playfair','space','dm-sans','lora','merriweather','nunito','montserrat','bebas-neue','caveat')) as bad_style,
--   (select count(*) from public.linktrees where slug in ('admin','api','auth','dashboard','login','signup','logout','forgot-password','reset-password',
--      'privacy','terms','dev-preview','en','id','www','app','help','support','settings','account','linkhub','static','_next')) as reserved_slug,
--   (select count(*) from public.linktrees where avatar_url is not null and (avatar_url !~ '^https://' or avatar_url ~ '[[:space:]"''()\]')) as bad_avatar,
--   (select count(*) from public.products where image_url is not null and (image_url !~ '^https://' or image_url ~ '[[:space:]"''()\]')) as bad_image;

-- Cek sesudah dijalankan (hanya membaca):
-- select count(*) filter (where number is null) as products_without_number from public.products;
-- select count(*) from pg_proc where proname in ('insights_summary', 'set_product_number');
