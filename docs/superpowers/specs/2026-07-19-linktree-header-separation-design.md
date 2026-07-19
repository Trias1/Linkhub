# Linktree Header Separation Design

Date: 2026-07-19
Status: Approved

## Goal

Separate public header content from core Linktree account identity so editing Customize does not change the main Linktree record. Move slug and profile photo URL management into Account Settings, remove bio from Account, and expand the curated font selection without allowing arbitrary remote font imports.

## Data Model

Create `public.linktree_headers` with one row per Linktree:

- `linktree_id uuid primary key references public.linktrees(id) on delete cascade`
- `title text not null default 'My Linktree'` with a 60-character limit
- `bio text not null default ''` with a 160-character limit
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

The migration backfills each existing Linktree using `linktrees.name` as `title` and `linktrees.bio` as `bio`. Existing data remains intact in `linktrees`; the new public rendering path reads header content from `linktree_headers`.

Row Level Security allows public reads and restricts insert/update/delete to the owner of the related Linktree. New Linktrees receive a header row during creation.

## Ownership of Fields

### Account Settings

Account Settings owns core Linktree identity:

- Name: internal Linktree/account display name used in dashboard navigation
- Owner email: read-only authentication email
- Profile photo URL: stored in `linktrees.avatar_url`
- Slug: stored in `linktrees.slug`

Bio is removed from Account Settings. `saveAccount` no longer updates `linktrees.bio`.

### Header Customize

Header Customize owns public header content and presentation:

- Title: stored in `linktree_headers.title`
- Bio: stored in `linktree_headers.bio`
- Title style: stored in `linktrees.title_style`
- Title color: stored in `linktrees.title_color`

Profile image upload is removed from Header Customize. Public pages and previews use `linktrees.avatar_url` managed from Account Settings.

## Read and Write Flow

- Customize page queries `linktrees` design fields and the matching `linktree_headers` row in parallel.
- `saveCustomDesign` updates `linktree_headers` title/bio and `linktrees` visual settings.
- Account page reads name, slug, and avatar URL from `linktrees`.
- `saveAccount` validates and updates name, slug, and photo URL.
- Public profile rendering queries the matching header row and uses fallback values from `linktrees` only if migration data is temporarily unavailable.
- Links and Shops live previews receive header title/bio rather than using the internal Linktree name/bio directly.

## Photo URL Validation

Account Settings accepts an optional profile photo URL. Empty input removes the photo. Non-empty values must use `http` or `https`. Existing uploaded Supabase Storage URLs remain valid.

## Fonts

Keep font selection curated to avoid arbitrary third-party requests and unpredictable performance. The available page fonts are:

1. Geist
2. Inter
3. Poppins
4. Playfair Display
5. Space Grotesk
6. DM Sans
7. Lora
8. Merriweather
9. Nunito
10. Montserrat
11. Bebas Neue
12. Caveat

Fonts are loaded through `next/font/google` in the root layout and exposed through existing `font-*` CSS classes. Existing stored font values remain valid.

## Migration and Compatibility

Add `supabase/016-linktree-headers.sql` and update the fresh-install schema/migration path. The migration:

1. Creates `linktree_headers` if missing.
2. Enables RLS and installs owner/public policies.
3. Backfills existing Linktrees without overwriting existing header rows.
4. Adds an `updated_at` trigger using the existing project trigger pattern when available.

No Linktree, profile image, slug, title, or bio data is deleted.

## Validation

- Existing Linktrees show the same public title and bio after migration.
- Changing Customize title/bio does not change the Account name.
- Changing Account name does not change the public header title.
- Changing Account photo URL updates dashboard avatar, previews, and public page.
- Slug changes continue to update the public URL.
- All 12 fonts render in Customize preview and public pages.
- `npm run lint` and `npm run build` pass.

## Deliberate Scope

- No arbitrary Google Font URL input.
- No separate image-upload workflow in Account; Account accepts a URL only.
- Existing `linktrees.bio` and legacy profile columns are retained for compatibility and rollback, but are no longer edited by Account or used as the primary public header source.