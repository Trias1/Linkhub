-- Contacts are accepted only by the server route after validation and rate limiting.
drop policy if exists "Anyone creates contacts" on public.contacts;
revoke insert on public.contacts from anon, authenticated;
