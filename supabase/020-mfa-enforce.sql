-- 020: wajibkan kode MFA di level database untuk akun yang mengaktifkan MFA.
-- Sudah dijalankan di produksi 4 Nov 2026 dengan OK owner (cek: 32 policy restrictive, 13 tabel, 1 fungsi).
-- Kode app tidak lagi memakai "Trust this device": sesi perangkat tepercaya masih aal1 dan akan ditolak di sini.
--
-- Pola dari dokumentasi Supabase (Auth > MFA > "Enforce only for users that have opted-in"):
-- policy RESTRICTIVE ditambahkan di atas policy yang sudah ada. Akun tanpa MFA tidak terpengaruh.
-- Fungsi security definer (trigger signup, pencatat klik/view, rate limit) dan service role tidak terkena RLS.

-- True kalau sesi sudah aal2, atau akun tidak punya faktor MFA yang terverifikasi.
create or replace function public.mfa_ok()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
      or not exists (select 1 from auth.mfa_factors where user_id = auth.uid() and status = 'verified');
$$;
revoke all on function public.mfa_ok() from public, anon;
grant execute on function public.mfa_ok() to authenticated;

-- Tulis (insert/update/delete) di tabel milik user. Baca halaman publik tidak dibatasi.
do $$
declare t text; cmd text;
begin
  foreach t in array array['profiles','linktrees','linktree_headers','links','link_collections','products','shop_collections','trusted_devices'] loop
    foreach cmd in array array['insert','update','delete'] loop
      execute format('drop policy if exists "MFA required (%s)" on public.%I', cmd, t);
      if cmd = 'insert' then
        execute format('create policy "MFA required (%s)" on public.%I as restrictive for insert to authenticated with check ((select public.mfa_ok()))', cmd, t);
      elsif cmd = 'update' then
        execute format('create policy "MFA required (%s)" on public.%I as restrictive for update to authenticated using ((select public.mfa_ok())) with check ((select public.mfa_ok()))', cmd, t);
      else
        execute format('create policy "MFA required (%s)" on public.%I as restrictive for delete to authenticated using ((select public.mfa_ok()))', cmd, t);
      end if;
    end loop;
  end loop;

  -- Baca data pribadi: kontak pengunjung, statistik, perangkat tepercaya.
  foreach t in array array['contacts','page_views','link_clicks','product_clicks','trusted_devices'] loop
    execute format('drop policy if exists "MFA required (select)" on public.%I', t);
    execute format('create policy "MFA required (select)" on public.%I as restrictive for select to authenticated using ((select public.mfa_ok()))', t);
  end loop;
end $$;

-- Upload, ganti dan hapus foto (product-images, profile-images).
drop policy if exists "MFA required (insert)" on storage.objects;
drop policy if exists "MFA required (update)" on storage.objects;
drop policy if exists "MFA required (delete)" on storage.objects;
create policy "MFA required (insert)" on storage.objects as restrictive for insert to authenticated with check ((select public.mfa_ok()));
create policy "MFA required (update)" on storage.objects as restrictive for update to authenticated using ((select public.mfa_ok())) with check ((select public.mfa_ok()));
create policy "MFA required (delete)" on storage.objects as restrictive for delete to authenticated using ((select public.mfa_ok()));

-- Cek (hanya membaca): harus 32 policy (8 tabel x 3 + 5 select + 3 storage) dan 1 fungsi.
select count(*) as mfa_policies from pg_policies where policyname like 'MFA required (%';
select count(*) as mfa_function from pg_proc where proname = 'mfa_ok';

-- Batalkan (kalau perlu):
-- do $$ declare r record; begin
--   for r in select schemaname, tablename, policyname from pg_policies where policyname like 'MFA required (%' loop
--     execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
--   end loop; end $$;
-- drop function if exists public.mfa_ok();
