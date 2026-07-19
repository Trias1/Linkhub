# LinkHub

LinkHub adalah platform open-source untuk membuat satu halaman berisi tautan, toko, profil, dan kontak yang mudah dibagikan. Dashboard-nya menyatukan pengelolaan konten, desain, insight, dan beberapa Linktree dalam satu aplikasi.

## Fitur

- Kelola tautan dan koleksi dengan drag-and-drop.
- Buat katalog produk beserta gambar dan harga Rupiah.
- Kustomisasi tema, warna, wallpaper, tombol, font, profil, dan footer.
- Live preview untuk halaman publik.
- Insight views, clicks, contacts, dan rentang tanggal.
- Multi-Linktree hingga tiga profil per akun.
- Autentikasi, MFA authenticator, trusted devices, dan pengaturan privasi.
- Dashboard admin untuk memantau pengguna dan penggunaan aplikasi.
- Dukungan Bahasa Indonesia dan English.

## Teknologi

- Next.js 16
- React 19
- Supabase Auth, Postgres, Storage, dan Row Level Security
- TypeScript
- Tailwind CSS

## Menjalankan Lokal

```bash
git clone https://github.com/Trias1/Linkhub.git
cd Linkhub
npm install
cp .env.example .env.local
npm run dev
```

Buka `http://localhost:3000`.

Di Windows PowerShell, gunakan:

```powershell
Copy-Item .env.example .env.local
```

## Supabase

1. Buat project Supabase.
2. Isi variabel pada `.env.local`.
3. Jalankan `supabase/schema.sql` melalui SQL Editor.
4. Jalankan migration berikutnya di folder `supabase` sesuai urutan nomor.

Jangan pernah mengekspos `SUPABASE_SERVICE_ROLE_KEY` ke browser atau memasukkan `.env.local` ke Git.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Kontribusi

Kontribusi, laporan bug, dan ide fitur sangat diterima. Fork repository ini, buat branch perubahan, lalu kirim pull request dengan penjelasan yang jelas.

## Lisensi

LinkHub adalah software open-source yang dirilis menggunakan [MIT License](LICENSE).

Built with care by Trias.