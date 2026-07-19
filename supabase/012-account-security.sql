-- Account privacy and trusted-device support.
alter table public.profiles add column if not exists allow_data_sharing boolean not null default true;
grant update (allow_data_sharing) on public.profiles to authenticated;

create table if not exists public.trusted_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token_hash text not null unique,
  label text not null default 'Browser',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.trusted_devices enable row level security;
drop policy if exists "Users read own trusted devices" on public.trusted_devices;
drop policy if exists "Users create own trusted devices" on public.trusted_devices;
drop policy if exists "Users delete own trusted devices" on public.trusted_devices;
create policy "Users read own trusted devices" on public.trusted_devices for select using (auth.uid() = user_id);
create policy "Users create own trusted devices" on public.trusted_devices for insert with check (auth.uid() = user_id and (select auth.jwt()->>'aal') = 'aal2');
create policy "Users delete own trusted devices" on public.trusted_devices for delete using (auth.uid() = user_id);
create index if not exists trusted_devices_user_expires_idx on public.trusted_devices(user_id, expires_at desc);
