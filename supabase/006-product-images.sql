alter table public.products
  add column if not exists image_path text,
  add column if not exists image_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "Users upload own product images" on storage.objects;
drop policy if exists "Users update own product images" on storage.objects;
drop policy if exists "Users delete own product images" on storage.objects;

create policy "Users upload own product images" on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users update own product images" on storage.objects for update to authenticated
using (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete own product images" on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);