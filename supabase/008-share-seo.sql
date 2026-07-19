alter table public.profiles
  add column if not exists seo_title text not null default '',
  add column if not exists seo_description text not null default '',
  add column if not exists share_image_color text not null default '#171712';

alter table public.profiles
  drop constraint if exists valid_seo_title,
  add constraint valid_seo_title check (char_length(seo_title) <= 70),
  drop constraint if exists valid_seo_description,
  add constraint valid_seo_description check (char_length(seo_description) <= 160),
  drop constraint if exists valid_share_image_color,
  add constraint valid_share_image_color check (share_image_color ~ '^#[0-9A-Fa-f]{6}$');

grant update (seo_title, seo_description, share_image_color) on public.profiles to authenticated;