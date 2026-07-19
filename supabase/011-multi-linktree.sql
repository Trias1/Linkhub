create table if not exists public.linktrees (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'My Linktree',
  bio text not null default '',
  slug text unique,
  avatar_url text,
  avatar_path text,
  theme_preset text not null default 'peach',
  background_color text not null default '#FFF1E6',
  text_color text not null default '#3D2C2A',
  button_color text not null default '#FFB4A2',
  title_style text not null default 'normal',
  title_color text not null default '#3D2C2A',
  wallpaper_style text not null default 'solid',
  button_style text not null default 'solid',
  button_roundness text not null default 'rounded',
  button_text_color text not null default '#3D2C2A',
  page_font text not null default 'geist',
  custom_footer text not null default '',
  seo_title text not null default '',
  seo_description text not null default '',
  share_image_color text not null default '#171712',
  created_at timestamptz not null default now(),
  constraint linktree_valid_slug check (slug is null or slug ~ '^[a-z0-9-]{3,40}$'),
  constraint linktree_valid_colors check (background_color ~ '^#[0-9A-Fa-f]{6}$' and text_color ~ '^#[0-9A-Fa-f]{6}$' and button_color ~ '^#[0-9A-Fa-f]{6}$' and title_color ~ '^#[0-9A-Fa-f]{6}$' and button_text_color ~ '^#[0-9A-Fa-f]{6}$' and share_image_color ~ '^#[0-9A-Fa-f]{6}$')
);

insert into public.linktrees (id, owner_id, name, bio, slug, avatar_url, avatar_path, theme_preset, background_color, text_color, button_color, title_style, title_color, wallpaper_style, button_style, button_roundness, button_text_color, page_font, custom_footer, seo_title, seo_description, share_image_color, created_at)
select id, id, name, bio, slug, avatar_url, avatar_path, theme_preset, background_color, text_color, button_color, title_style, title_color, wallpaper_style, button_style, button_roundness, button_text_color, page_font, custom_footer, seo_title, seo_description, share_image_color, created_at
from public.profiles
on conflict (id) do nothing;

alter table public.linktrees enable row level security;
drop policy if exists "Linktrees are public" on public.linktrees;
drop policy if exists "Users create own linktrees" on public.linktrees;
drop policy if exists "Users update own linktrees" on public.linktrees;
drop policy if exists "Users delete own linktrees" on public.linktrees;
create policy "Linktrees are public" on public.linktrees for select using (true);
create policy "Users create own linktrees" on public.linktrees for insert with check (auth.uid() = owner_id);
create policy "Users update own linktrees" on public.linktrees for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "Users delete own linktrees" on public.linktrees for delete using (auth.uid() = owner_id);

create or replace function public.enforce_linktree_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.linktrees where owner_id = new.owner_id) >= 3 then
    raise exception 'Maximum 3 Linktrees per account';
  end if;
  return new;
end;
$$;
drop trigger if exists enforce_linktree_limit_trigger on public.linktrees;
create trigger enforce_linktree_limit_trigger before insert on public.linktrees for each row execute procedure public.enforce_linktree_limit();

alter table public.link_collections add column if not exists linktree_id uuid references public.linktrees(id) on delete cascade;
alter table public.links add column if not exists linktree_id uuid references public.linktrees(id) on delete cascade;
alter table public.shop_collections add column if not exists linktree_id uuid references public.linktrees(id) on delete cascade;
alter table public.products add column if not exists linktree_id uuid references public.linktrees(id) on delete cascade;
alter table public.page_views add column if not exists linktree_id uuid references public.linktrees(id) on delete cascade;
alter table public.link_clicks add column if not exists linktree_id uuid references public.linktrees(id) on delete cascade;
alter table public.contacts add column if not exists linktree_id uuid references public.linktrees(id) on delete cascade;

update public.link_collections set linktree_id = user_id where linktree_id is null;
update public.links set linktree_id = user_id where linktree_id is null;
update public.shop_collections set linktree_id = user_id where linktree_id is null;
update public.products set linktree_id = user_id where linktree_id is null;
update public.page_views set linktree_id = profile_id where linktree_id is null;
update public.link_clicks set linktree_id = profile_id where linktree_id is null;
update public.contacts set linktree_id = profile_id where linktree_id is null;

alter table public.link_collections alter column linktree_id set not null;
alter table public.links alter column linktree_id set not null;
alter table public.shop_collections alter column linktree_id set not null;
alter table public.products alter column linktree_id set not null;
alter table public.page_views alter column linktree_id set not null;
alter table public.link_clicks alter column linktree_id set not null;
alter table public.contacts alter column linktree_id set not null;

create index if not exists linktrees_owner_created_idx on public.linktrees(owner_id, created_at);
create index if not exists link_collections_linktree_idx on public.link_collections(linktree_id, position);
create index if not exists links_linktree_idx on public.links(linktree_id, position);
create index if not exists shop_collections_linktree_idx on public.shop_collections(linktree_id, position);
create index if not exists products_linktree_idx on public.products(linktree_id, position);
create index if not exists page_views_linktree_idx on public.page_views(linktree_id, created_at desc);
create index if not exists link_clicks_linktree_idx on public.link_clicks(linktree_id, created_at desc);
create index if not exists contacts_linktree_idx on public.contacts(linktree_id, created_at desc);
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''));
  insert into public.linktrees (id, owner_id, name)
  values (new.id, new.id, coalesce(new.raw_user_meta_data ->> 'name', 'My Linktree'));
  return new;
end;
$$;