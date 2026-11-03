-- 017: kepemilikan baris dicek lewat Linktree (bukan hanya user_id), RPC statistik hanya untuk server,
-- profiles tidak lagi publik, dan rate limit di server untuk login/daftar/kontak/klik.
-- Jalankan sekali di Supabase SQL Editor. Aman dijalankan ulang.

-- 1. Helper: apakah user yang login pemilik Linktree ini?
create or replace function public.owns_linktree(p_linktree_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.linktrees where id = p_linktree_id and owner_id = (select auth.uid()));
$$;
revoke all on function public.owns_linktree(uuid) from public, anon;
grant execute on function public.owns_linktree(uuid) to authenticated;

-- 2. links: hanya pemilik Linktree yang boleh menulis, dan collection harus milik Linktree yang sama.
drop policy if exists "Users insert own links" on public.links;
drop policy if exists "Users update own links" on public.links;
drop policy if exists "Users delete own links" on public.links;
create policy "Users insert own links" on public.links for insert to authenticated
with check (auth.uid() = user_id and public.owns_linktree(linktree_id)
  and (collection_id is null or exists (select 1 from public.link_collections c where c.id = collection_id and c.linktree_id = links.linktree_id)));
create policy "Users update own links" on public.links for update to authenticated
using (auth.uid() = user_id and public.owns_linktree(linktree_id))
with check (auth.uid() = user_id and public.owns_linktree(linktree_id)
  and (collection_id is null or exists (select 1 from public.link_collections c where c.id = collection_id and c.linktree_id = links.linktree_id)));
create policy "Users delete own links" on public.links for delete to authenticated
using (auth.uid() = user_id and public.owns_linktree(linktree_id));

-- 3. link_collections
drop policy if exists "Users insert own collections" on public.link_collections;
drop policy if exists "Users update own collections" on public.link_collections;
drop policy if exists "Users delete own collections" on public.link_collections;
create policy "Users insert own collections" on public.link_collections for insert to authenticated
with check (auth.uid() = user_id and public.owns_linktree(linktree_id));
create policy "Users update own collections" on public.link_collections for update to authenticated
using (auth.uid() = user_id and public.owns_linktree(linktree_id))
with check (auth.uid() = user_id and public.owns_linktree(linktree_id));
create policy "Users delete own collections" on public.link_collections for delete to authenticated
using (auth.uid() = user_id and public.owns_linktree(linktree_id));

-- 4. shop_collections
drop policy if exists "Users insert own shop collections" on public.shop_collections;
drop policy if exists "Users update own shop collections" on public.shop_collections;
drop policy if exists "Users delete own shop collections" on public.shop_collections;
create policy "Users insert own shop collections" on public.shop_collections for insert to authenticated
with check (auth.uid() = user_id and public.owns_linktree(linktree_id));
create policy "Users update own shop collections" on public.shop_collections for update to authenticated
using (auth.uid() = user_id and public.owns_linktree(linktree_id))
with check (auth.uid() = user_id and public.owns_linktree(linktree_id));
create policy "Users delete own shop collections" on public.shop_collections for delete to authenticated
using (auth.uid() = user_id and public.owns_linktree(linktree_id));

-- 5. products: collection wajib milik Linktree yang sama.
drop policy if exists "Users insert own products" on public.products;
drop policy if exists "Users update own products" on public.products;
drop policy if exists "Users delete own products" on public.products;
create policy "Users insert own products" on public.products for insert to authenticated
with check (auth.uid() = user_id and public.owns_linktree(linktree_id)
  and exists (select 1 from public.shop_collections c where c.id = collection_id and c.linktree_id = products.linktree_id));
create policy "Users update own products" on public.products for update to authenticated
using (auth.uid() = user_id and public.owns_linktree(linktree_id))
with check (auth.uid() = user_id and public.owns_linktree(linktree_id)
  and exists (select 1 from public.shop_collections c where c.id = collection_id and c.linktree_id = products.linktree_id));
create policy "Users delete own products" on public.products for delete to authenticated
using (auth.uid() = user_id and public.owns_linktree(linktree_id));

-- 6. RPC statistik hanya bisa dipanggil server (service role). Default Supabase memberi execute ke anon
--    dan authenticated secara langsung, jadi revoke dari public saja tidak cukup.
revoke execute on function public.record_page_view(uuid, text) from anon, authenticated;
revoke execute on function public.record_link_click(uuid) from anon, authenticated;

-- 7. profiles hanya bisa dibaca pemiliknya dan admin (halaman publik memakai tabel linktrees).
drop policy if exists "Profiles are public" on public.profiles;
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles for select using (auth.uid() = id or public.is_admin());

-- 8. Rate limit di server. Kunci berisi hash (bukan IP mentah). Tabel tanpa policy = tidak bisa diakses
--    anon/authenticated; hanya server lewat fungsi di bawah.
create table if not exists public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 1,
  primary key (key, window_start)
);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

create or replace function public.hit_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  bucket timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  total integer;
begin
  insert into public.rate_limits (key, window_start) values (p_key, bucket)
  on conflict (key, window_start) do update set hits = public.rate_limits.hits + 1
  returning hits into total;
  -- bersihkan penghitung lama sesekali (hanya data rate limit, bukan data user)
  if random() < 0.02 then delete from public.rate_limits where window_start < now() - interval '1 day'; end if;
  return total <= p_limit;
end;
$$;
revoke all on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;

-- 9. Cek apakah pernah ada baris "titipan" dari akun lain (hanya membaca, tidak menghapus).
--    Kalau hasilnya kosong, aman. Kalau ada, kirim hasilnya ke developer sebelum memutuskan apa pun.
-- select 'links' as tabel, l.id, l.title, l.url, l.user_id, t.owner_id from public.links l join public.linktrees t on t.id = l.linktree_id where l.user_id <> t.owner_id
-- union all select 'products', p.id, p.title, p.url, p.user_id, t.owner_id from public.products p join public.linktrees t on t.id = p.linktree_id where p.user_id <> t.owner_id
-- union all select 'link_collections', c.id, c.title, null, c.user_id, t.owner_id from public.link_collections c join public.linktrees t on t.id = c.linktree_id where c.user_id <> t.owner_id
-- union all select 'shop_collections', c.id, c.title, null, c.user_id, t.owner_id from public.shop_collections c join public.linktrees t on t.id = c.linktree_id where c.user_id <> t.owner_id;
