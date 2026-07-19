create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  bio text not null default '',
  slug text unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  constraint valid_slug check (slug is null or slug ~ '^[a-z0-9-]{3,40}$')
);

create table public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  url text not null check (url ~ '^https?://' or url ~ '^mailto:[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.links enable row level security;

create policy "Profiles are public" on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Active links are public" on public.links for select using (is_active or auth.uid() = user_id);
create policy "Users insert own links" on public.links for insert with check (auth.uid() = user_id);
create policy "Users update own links" on public.links for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own links" on public.links for delete using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create index links_user_position_idx on public.links(user_id, position);

create table if not exists public.linktree_headers (
  linktree_id uuid primary key references public.linktrees(id) on delete cascade,
  title text not null default 'My Linktree' check (char_length(title) between 1 and 60),
  bio text not null default '' check (char_length(bio) <= 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.linktree_headers (linktree_id, title, bio)
select id, coalesce(nullif(name, ''), 'My Linktree'), coalesce(bio, '') from public.linktrees
on conflict (linktree_id) do nothing;
create or replace function public.create_linktree_header()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.linktree_headers (linktree_id, title, bio)
  values (new.id, coalesce(nullif(new.name, ''), 'My Linktree'), coalesce(new.bio, ''));
  return new;
end;
$$;
create trigger create_linktree_header_trigger after insert on public.linktrees for each row execute procedure public.create_linktree_header();
alter table public.linktree_headers enable row level security;
create policy "Linktree headers are public" on public.linktree_headers for select using (true);
create policy "Owners create Linktree headers" on public.linktree_headers for insert with check (exists (select 1 from public.linktrees where id = linktree_id and owner_id = auth.uid()));
create policy "Owners update Linktree headers" on public.linktree_headers for update using (exists (select 1 from public.linktrees where id = linktree_id and owner_id = auth.uid())) with check (exists (select 1 from public.linktrees where id = linktree_id and owner_id = auth.uid()));
create policy "Owners delete Linktree headers" on public.linktree_headers for delete using (exists (select 1 from public.linktrees where id = linktree_id and owner_id = auth.uid()));
grant select on public.linktree_headers to anon, authenticated;
grant insert, update, delete on public.linktree_headers to authenticated;
