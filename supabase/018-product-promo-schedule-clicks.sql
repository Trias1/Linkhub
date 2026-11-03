-- 018: harga coret, "Lagi promo", jadwal tayang, dan statistik klik per produk.
-- Jalankan SETELAH 017. Aman dijalankan ulang. Tidak mengubah atau menghapus data lama.

alter table public.products
  add column if not exists compare_price text not null default '' check (char_length(compare_price) <= 40),
  add column if not exists is_featured boolean not null default false,
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz;

-- Produk terjadwal/berakhir tidak terlihat publik, tapi tetap terlihat oleh pemiliknya.
drop policy if exists "Active products are public" on public.products;
create policy "Active products are public" on public.products for select using (
  (is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()))
  or auth.uid() = user_id
);

create table if not exists public.product_clicks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  linktree_id uuid not null references public.linktrees(id) on delete cascade,
  platform text not null default 'website',
  created_at timestamptz not null default now()
);
create index if not exists product_clicks_linktree_idx on public.product_clicks(linktree_id, created_at desc);
alter table public.product_clicks enable row level security;
revoke insert, update, delete on public.product_clicks from anon, authenticated;
drop policy if exists "Owners read product clicks" on public.product_clicks;
create policy "Owners read product clicks" on public.product_clicks for select to authenticated
using (public.owns_linktree(linktree_id) or public.is_admin());

-- Dipanggil server (/api/product/[id]); mengembalikan URL tujuan kalau produk sedang tayang.
create or replace function public.record_product_click(p_product_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare item record;
begin
  select id, linktree_id, platform, url into item from public.products
  where id = p_product_id and is_active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now());
  if not found then return null; end if;
  insert into public.product_clicks (product_id, linktree_id, platform) values (item.id, item.linktree_id, item.platform);
  return item.url;
end;
$$;
revoke all on function public.record_product_click(uuid) from public, anon, authenticated;
grant execute on function public.record_product_click(uuid) to service_role;
