# LinkHub

LinkHub is an open-source platform for building a shareable page for your links, products, profile, and contacts. Its unified dashboard makes it easy to manage content, customize the design, review insights, and operate multiple Linktrees from one account.

**Live:** https://linkhub-dun.vercel.app

## Features

- Manage links and collections with drag-and-drop ordering.
- Build product catalogs with images and formatted Indonesian Rupiah prices.
- Customize themes, colors, wallpapers, buttons, fonts, profiles, and footers.
- Preview public pages while editing.
- Track views, clicks, contacts, and custom date ranges.
- Create and switch between up to three Linktrees per account.
- Use password authentication, authenticator MFA, and trusted devices.
- Monitor users and application activity from the admin dashboard.
- Switch between Indonesian and English.

## Tech Stack

- Next.js 16 and React 19
- TypeScript and Tailwind CSS
- Supabase Auth, Postgres, Storage, and Row Level Security
- Vercel

## Local Development

```bash
git clone https://github.com/Trias1/Linkhub.git
cd Linkhub
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, replace the copy command with:

```powershell
Copy-Item .env.example .env.local
```

Open `http://localhost:3000`.

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` is required only for privileged server operations such as full account deletion and administrative analytics. Never expose it to browser code or commit it to Git.

## Supabase Setup

1. Create a Supabase project.
2. Add the project credentials to `.env.local`.
3. Run `supabase/schema.sql` in the Supabase SQL Editor.
4. Run the remaining SQL migrations in numerical order.
5. Add the application URL and `/auth/callback` URL to the Supabase authentication URL configuration.

## Commands

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Contributing

Contributions, bug reports, and feature ideas are welcome. Fork the repository, create a focused branch, and open a pull request with a clear explanation of the change.

## License

LinkHub is open-source software released under the [MIT License](LICENSE).

Built with care by Trias.