# Customize Mobile Responsive Design

Date: 2026-07-19
Status: Approved

## Goal

Make the Customize page follow the same mobile viewport behavior as Links, Shops, and Insights so its floating bottom navigation keeps the standard size.

## Root Cause

Customize contains nested grid children and a desktop-width preview. Those elements do not all explicitly allow shrinking, so they can create horizontal overflow on narrow screens. The fixed bottom navigation then appears oversized relative to the widened page.

## Design

- Keep the existing desktop two-column Customize layout.
- Explicitly allow the Customize layout, form, sections, and preview wrapper to shrink with `min-width: 0`.
- At the dashboard mobile breakpoint, use a single block column with `width: 100%` and no horizontal overflow.
- Make the preview use the available content width while retaining its existing maximum desktop width.
- Do not change the shared floating navigation dimensions or other dashboard pages.

## Validation

- Customize has no horizontal page overflow on mobile.
- The bottom navigation matches Links, Shops, Design, and Insights.
- Form controls, roundness choices, Share button, preview, and Save button remain usable.
- Desktop Customize remains two columns.
- Lint and production build pass.
