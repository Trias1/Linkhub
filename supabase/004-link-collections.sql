create table if not exists public.link_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'My Collection' check (char_length(title) between 1 and 80),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.link_collections enable row level security;

drop policy if exists "Collections are public" on public.link_collections;
drop policy if exists "Users insert own collections" on public.link_collections;
drop policy if exists "Users update own collections" on public.link_collections;
drop policy if exists "Users delete own collections" on public.link_collections;

create policy "Collections are public" on public.link_collections for select using (true);
create policy "Users insert own collections" on public.link_collections for insert with check (auth.uid() = user_id);
create policy "Users update own collections" on public.link_collections for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own collections" on public.link_collections for delete using (auth.uid() = user_id);

alter table public.links
  add column if not exists collection_id uuid references public.link_collections(id) on delete set null,
  add column if not exists platform text;

create index if not exists link_collections_user_position_idx on public.link_collections(user_id, position);
create index if not exists links_collection_position_idx on public.links(collection_id, position);