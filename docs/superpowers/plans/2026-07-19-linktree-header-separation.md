# Linktree Header Separation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate public header title/bio from dashboard identity, move photo URL and slug to Account, and expose twelve curated fonts.

**Architecture:** Add one owner-protected `linktree_headers` row per Linktree and backfill existing data. Public pages and previews combine that header with the existing Linktree design and Account photo, falling back to legacy values during migration.

**Tech Stack:** Next.js App Router, Server Actions, Supabase Postgres/RLS, `next/font/google`, CSS.

---

### Task 1: Add header storage

**Files:** `supabase/016-linktree-headers.sql`, `supabase/schema.sql`

- [ ] Create the constrained table, timestamps, RLS policies, grants, and backfill.
- [ ] Add the same storage path to the fresh-install schema.

### Task 2: Split account and customize writes

**Files:** `src/app/dashboard/actions.ts`, `src/app/dashboard/account/page.tsx`, `src/app/dashboard/design/customize/page.tsx`, `src/app/dashboard/design/customize/customize-form.tsx`, `src/app/dashboard/new/page.tsx`

- [ ] Make Account update name, slug, and validated HTTP(S) photo URL only.
- [ ] Make Customize upsert public title/bio and retain visual writes.
- [ ] Create a header row with each new Linktree and update both forms.

### Task 3: Read public headers everywhere

**Files:** `src/app/[slug]/page.tsx`, `src/app/[slug]/public-profile-content.tsx`, `src/app/dashboard/links/page.tsx`, `src/app/dashboard/links/links-workspace.tsx`, `src/app/dashboard/shops/page.tsx`, `src/app/dashboard/shops/shop-workspace.tsx`

- [ ] Query `linktree_headers`, keeping legacy title/bio as migration fallback.
- [ ] Use public title/bio in metadata, public rendering, and previews.

### Task 4: Add curated fonts

**Files:** `src/app/layout.tsx`, `src/app/globals.css`, `src/app/dashboard/actions.ts`, `src/app/dashboard/design/customize/customize-form.tsx`

- [ ] Load and expose Lora, Merriweather, Nunito, Montserrat, Bebas Neue, and Caveat.
- [ ] Extend form and Server Action allowlists without adding dependencies.

### Task 5: Verify application

- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Run `git diff --check` and inspect status.

