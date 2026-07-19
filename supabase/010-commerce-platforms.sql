alter table public.products
  add column if not exists platform text not null default 'website';