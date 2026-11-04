-- 019: nama dan alamat halaman diisi saat daftar. Trigger membuat halaman pertama memakai metadata
-- "name" dan "slug" dari form daftar. Kalau alamat tidak valid atau sudah dipakai, halaman tetap dibuat
-- tanpa alamat (user bisa mengisinya di Account), jadi pendaftaran tidak pernah gagal karena slug.
-- Jalankan sekali di Supabase SQL Editor. Aman dijalankan ulang. Tidak mengubah data lama.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  display_name text := left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), 'My page'), 60);
  wanted text := lower(coalesce(new.raw_user_meta_data ->> 'slug', ''));
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''));
  if wanted ~ '^[a-z0-9-]{3,40}$' then
    begin
      insert into public.linktrees (id, owner_id, name, slug) values (new.id, new.id, display_name, wanted);
      return new;
    exception when unique_violation then
      null; -- alamat keburu dipakai orang lain: lanjut tanpa alamat
    end;
  end if;
  insert into public.linktrees (id, owner_id, name) values (new.id, new.id, display_name);
  return new;
end;
$$;
