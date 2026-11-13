# LinkHub

LinkHub is a free, open-source shop page for people who sell or promote products on Shopee, Tokopedia and TikTok Shop. Put your products, store links and other links on one page, share one link in your bio, and see which products get the taps.

**Live:** https://linkhub.west-solutions.web.id

## Features

**Products**
- Product catalog with photos, Rupiah prices and crossed-out original prices, grouped in categories.
- A "Buy on Shopee / Tokopedia / TikTok Shop" button per product, detected from the link.
- Promos with start and end dates: products show in "On sale" and hide themselves when the promo ends.
- Product numbers that never change, so viewers can find "number 12" by typing it on the page or opening `/your-page?no=12`.
- Auto-fill of name, price and photo from a product link where the store allows it (for example Tokopedia share links), and for Shopee through the Shopee Affiliate Open API when its keys are set.
- Add up to 10 product links at once as drafts, and export or import products as CSV.
- "New" and "Popular" labels, a countdown on promos that end soon, and a short personal note per product.
- A page per product (`/your-page/p/12`) with its own share image, and video lists (`/your-page/c/haul-1212`) with one link per video or post.
- Photos are resized in the browser before upload.

**Links**
- Store buttons at the top of the page, plus other links grouped under headings.
- Platforms are detected from the link (Instagram, TikTok, WhatsApp, GitHub, LinkedIn and more), and plain websites show their own icon.

**Design and sharing**
- Themes, colours, gradients, button styles, corners, fonts and footer, with a live phone preview.
- Share tools and a QR code (PNG or SVG) for your page.
- One bio link per app (`?src=tiktok`, `?src=instagram`, ...) so Insights can tell them apart.
- An optional "Some links are affiliate links" note.
- Installable web app; on Android, share a product from a marketplace app straight to LinkHub.

**Insights**
- Visitors, link clicks and buy clicks per day (WIB), top products, top links and clicks per store.
- Where visitors come from (TikTok, Instagram, WhatsApp and more) and the busiest hours. Only a one-word source is stored.
- CSV export, and an optional weekly summary email.

**Account and security**
- Up to three pages per account.
- Optional authenticator-app MFA, enforced in the database with Row Level Security.
- Rate limits and optional Cloudflare Turnstile on sign-up and sign-in.

Everything is free: there is no paid plan.

## Tech Stack

- Next.js 16 and React 19, TypeScript
- Supabase Auth, Postgres, Storage and Row Level Security
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
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
SHOPEE_AFFILIATE_APP_ID=
SHOPEE_AFFILIATE_SECRET=
CRON_SECRET=
RESEND_API_KEY=
EMAIL_FROM=
```

- `SUPABASE_SERVICE_ROLE_KEY` is used on the server for rate limits, click and view tracking, and account deletion. Never expose it to browser code or commit it to Git.
- The Turnstile keys are optional. Leave them empty to turn the captcha off locally.
- The Shopee Affiliate keys are optional. They turn on Shopee auto-fill and, for the admin account, "Use my affiliate link".
- `CRON_SECRET`, `RESEND_API_KEY` and `EMAIL_FROM` are optional. With all three set, the Vercel cron in `vercel.json` sends the weekly summary every Monday to owners who turned it on.

## Supabase Setup

1. Create a Supabase project.
2. Add the project credentials to `.env.local`.
3. Run `supabase/schema.sql` in the Supabase SQL Editor.
4. Run the numbered SQL files in `supabase/` in order.
5. Add the application URL and the `/auth/callback` URL to the Supabase authentication URL configuration.

## Commands

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Contributing

Contributions, bug reports and feature ideas are welcome. Fork the repository, create a focused branch, and open a pull request with a clear explanation of the change.

## License

LinkHub is open-source software released under the [MIT License](LICENSE).

Built with care by Trias.
