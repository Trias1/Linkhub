# Simple Auth Forms Design

Date: 2026-07-19
Status: Approved

## Goal

Restore Login and Sign Up to a simple standalone card instead of the dialog presentation. Both forms contain only email and password fields.

## UI

- Reuse the existing `auth-shell`, `auth-card`, `stack`, and `text-link` styles already used by password recovery.
- Keep the LinkHub brand, localized heading, description, errors, success messages, submit button, and link between Login and Sign Up.
- Remove the dialog wrapper and decorative dialog-specific presentation from Login and Sign Up.
- Keep the anti-bot `website` field as `type="hidden"` so it cannot appear as an empty textbox.

## Authentication

- Login continues to authenticate with email and password.
- Sign Up accepts only email and password.
- Sign Up no longer sends a `name` value in Supabase user metadata.
- New accounts receive the existing database defaults and can set their name later in Account Settings.

## Scope

- Do not change password reset or MFA behavior.
- Do not add dependencies or new shared abstractions.
- Delete `src/app/login/login-dialog.tsx` after Login and Sign Up no longer import it.

## Validation

- Login renders only Email and Password.
- Sign Up renders only Email and Password.
- No empty textbox appears above the first labeled field.
- Login, signup confirmation, locale text, password reset link, lint, and production build continue to work.
