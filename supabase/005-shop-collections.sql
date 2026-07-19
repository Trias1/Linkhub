create table if not exists public.shop_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'My Products' check (char_length(title) between 1 and 80),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  collection_id uuid not null references public.shop_collections(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  url text not null check (url ~ '^https?://'),
  price text not null default '' check (char_length(price) <= 40),
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.shop_collections enable row level security;
alter table public.products enable row level security;

drop policy if exists "Shop collections are public" on public.shop_collections;
drop policy if exists "Users insert own shop collections" on public.shop_collections;
drop policy if exists "Users update own shop collections" on public.shop_collections;
drop policy if exists "Users delete own shop collections" on public.shop_collections;
drop policy if exists "Active products are public" on public.products;
drop policy if exists "Users insert own products" on public.products;
drop policy if exists "Users update own products" on public.products;
drop policy if exists "Users delete own products" on public.products;

create policy "Shop collections are public" on public.shop_collections for select using (true);
create policy "Users insert own shop collections" on public.shop_collections for insert with check (auth.uid() = user_id);
create policy "Users update own shop collections" on public.shop_collections for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own shop collections" on public.shop_collections for delete using (auth.uid() = user_id);
create policy "Active products are public" on public.products for select using (is_active or auth.uid() = user_id);
create policy "Users insert own products" on public.products for insert with check (auth.uid() = user_id);
create policy "Users update own products" on public.products for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own products" on public.products for delete using (auth.uid() = user_id);

create index if not exists shop_collections_user_position_idx on public.shop_collections(user_id, position);
create index if not exists products_collection_position_idx on public.products(collection_id, position);