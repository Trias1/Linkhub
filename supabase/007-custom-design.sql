alter table public.profiles
  add column if not exists avatar_path text,
  add column if not exists title_style text not null default 'normal',
  add column if not exists title_color text not null default '#3D2C2A',
  add column if not exists wallpaper_style text not null default 'solid',
  add column if not exists button_style text not null default 'solid',
  add column if not exists button_roundness text not null default 'rounded',
  add column if not exists button_text_color text not null default '#3D2C2A',
  add column if not exists page_font text not null default 'geist',
  add column if not exists custom_footer text not null default '';

alter table public.profiles
  drop constraint if exists valid_title_style,
  add constraint valid_title_style check (title_style in ('normal','uppercase','italic','serif')),
  drop constraint if exists valid_wallpaper_style,
  add constraint valid_wallpaper_style check (wallpaper_style in ('solid','gradient','soft')),
  drop constraint if exists valid_button_style,
  add constraint valid_button_style check (button_style in ('solid','glass','outline')),
  drop constraint if exists valid_button_roundness,
  add constraint valid_button_roundness check (button_roundness in ('square','soft','rounded','pill')),
  drop constraint if exists valid_button_text_color,
  add constraint valid_button_text_color check (button_text_color ~ '^#[0-9A-Fa-f]{6}$'),
  drop constraint if exists valid_title_color,
  add constraint valid_title_color check (title_color ~ '^#[0-9A-Fa-f]{6}$'),
  drop constraint if exists valid_page_font,
  add constraint valid_page_font check (page_font in ('geist','inter','poppins','playfair','space','dm-sans')),
  drop constraint if exists valid_custom_footer,
  add constraint valid_custom_footer check (char_length(custom_footer) <= 120);

grant update (avatar_path, title_style, title_color, wallpaper_style, button_style, button_roundness, button_text_color, page_font, custom_footer) on public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-images', 'profile-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "Users upload own profile image" on storage.objects;
drop policy if exists "Users update own profile image" on storage.objects;
drop policy if exists "Users delete own profile image" on storage.objects;

create policy "Users upload own profile image" on storage.objects for insert to authenticated
with check (bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users update own profile image" on storage.objects for update to authenticated
using (bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete own profile image" on storage.objects for delete to authenticated
using (bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text);