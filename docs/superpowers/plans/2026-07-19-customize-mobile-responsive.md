# Customize Mobile Responsive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent Customize from widening the mobile viewport and keep the shared floating navigation at its standard size.

**Architecture:** Fix shrink behavior and mobile width in the existing Customize CSS only. Reuse the dashboard `1100px` and phone `650px` breakpoints without changing shared navigation code.

**Tech Stack:** CSS, Next.js App Router.

---

### Task 1: Constrain Customize layout

**Files:** `src/app/globals.css`

- [ ] Add `min-width: 0` to nested Customize grid containers.
- [ ] At `1100px`, switch Customize to a full-width block layout with contained overflow.
- [ ] Keep preview width fluid with its existing `390px` maximum.

### Task 2: Verify and publish

- [ ] Run `npm run lint`, `npm run build`, and `git diff --check`.
- [ ] Commit and push `main`.
- [ ] Deploy production and verify the domain response.
