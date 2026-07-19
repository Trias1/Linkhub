alter table public.profiles
  add column if not exists theme_preset text not null default 'peach',
  add column if not exists background_color text not null default '#FFF1E6',
  add column if not exists text_color text not null default '#3D2C2A',
  add column if not exists button_color text not null default '#FFB4A2',
  add column if not exists is_admin boolean not null default false;

alter table public.profiles
  drop constraint if exists valid_theme_preset,
  add constraint valid_theme_preset check (theme_preset in ('peach','lavender','mint','sky','butter','custom')),
  drop constraint if exists valid_background_color,
  add constraint valid_background_color check (background_color ~ '^#[0-9A-Fa-f]{6}$'),
  drop constraint if exists valid_text_color,
  add constraint valid_text_color check (text_color ~ '^#[0-9A-Fa-f]{6}$'),
  drop constraint if exists valid_button_color,
  add constraint valid_button_color check (button_color ~ '^#[0-9A-Fa-f]{6}$');

revoke update on public.profiles from authenticated;
grant update (name, bio, slug, avatar_url, theme_preset, background_color, text_color, button_color) on public.profiles to authenticated;

create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.link_clicks (
  id bigint generated always as identity primary key,
  link_id uuid not null references public.links(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.page_views enable row level security;
alter table public.link_clicks enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and is_admin = true);
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "Admins read all links" on public.links;
create policy "Admins read all links" on public.links for select using (public.is_admin());

drop policy if exists "Anyone records page views" on public.page_views;
drop policy if exists "Admins read page views" on public.page_views;
drop policy if exists "Anyone records link clicks" on public.link_clicks;
drop policy if exists "Admins read link clicks" on public.link_clicks;

create policy "Admins read page views" on public.page_views for select using (public.is_admin());
create policy "Admins read link clicks" on public.link_clicks for select using (public.is_admin());

create index if not exists page_views_profile_created_idx on public.page_views(profile_id, created_at desc);
create index if not exists link_clicks_profile_created_idx on public.link_clicks(profile_id, created_at desc);

-- Set admin once after registering: update public.profiles set is_admin = true where id = 'USER_UUID';
-- ponytail: raw event counts are directional, add bot filtering/rate limiting before monetizing analytics.
