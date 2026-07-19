create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default '' check (char_length(name) <= 80),
  email text not null check (char_length(email) between 3 and 254),
  created_at timestamptz not null default now()
);

alter table public.contacts enable row level security;

drop policy if exists "Anyone creates contacts" on public.contacts;
drop policy if exists "Users read own contacts" on public.contacts;
drop policy if exists "Admins read contacts" on public.contacts;

create policy "Anyone creates contacts" on public.contacts for insert with check (true);
create policy "Users read own contacts" on public.contacts for select using (auth.uid() = profile_id);
create policy "Admins read contacts" on public.contacts for select using (public.is_admin());

create index if not exists contacts_profile_created_idx on public.contacts(profile_id, created_at desc);