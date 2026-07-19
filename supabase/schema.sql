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
  url text not null check (url ~ '^https?://'),
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