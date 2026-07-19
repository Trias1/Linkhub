-- Allow secure web links and direct email links.
alter table public.links drop constraint if exists links_url_check;
alter table public.links add constraint links_url_check check (
  url ~ '^https?://' or
  url ~ '^mailto:[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
);