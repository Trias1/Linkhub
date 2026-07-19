# Simple Auth Forms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore simple standalone Login and Sign Up cards containing only email and password.

**Architecture:** Render both pages directly with existing auth CSS, keep the anti-bot value in a hidden input, and remove unused dialog code. Supabase signup receives credentials only.

**Tech Stack:** Next.js App Router, React Server Components, Server Actions, Supabase Auth.

---

### Task 1: Replace auth dialog pages

**Files:** `src/app/login/page.tsx`, `src/app/signup/page.tsx`, `src/app/login/login-dialog.tsx`

- [ ] Render Login with the existing `auth-shell` and `auth-card` styles.
- [ ] Render Sign Up with email and password only.
- [ ] Use `type="hidden"` for the anti-bot field and delete the unused dialog component.

### Task 2: Remove signup name metadata

**Files:** `src/app/auth/actions.ts`

- [ ] Call `supabase.auth.signUp` with email and password only.

### Task 3: Verify and publish

- [ ] Run `npm run lint`, `npm run build`, and `git diff --check`.
- [ ] Commit and push `main` to GitHub.
- [ ] Deploy production with Vercel and verify the public domain.
