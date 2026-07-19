-- Harden trusted devices and analytics event integrity.
drop policy if exists "Users create own trusted devices" on public.trusted_devices;
create policy "Users create own trusted devices" on public.trusted_devices for insert with check (auth.uid() = user_id and (select auth.jwt()->>'aal') = 'aal2');

alter table public.page_views add column if not exists visitor_hash text;
alter table public.page_views add column if not exists viewed_on date not null default current_date;
create unique index if not exists page_views_daily_visitor_idx on public.page_views(linktree_id, visitor_hash, viewed_on) where visitor_hash is not null;

drop policy if exists "Anyone records page views" on public.page_views;
drop policy if exists "Anyone records link clicks" on public.link_clicks;
revoke insert on public.page_views from anon, authenticated;
revoke insert on public.link_clicks from anon, authenticated;

create or replace function public.record_page_view(p_linktree_id uuid, p_visitor_token text)
returns void language sql security definer set search_path = '' as $$
  insert into public.page_views (profile_id, linktree_id, visitor_hash)
  select owner_id, id, encode(extensions.digest(p_visitor_token, 'sha256'), 'hex')
  from public.linktrees where id = p_linktree_id
  on conflict do nothing;
$$;

create or replace function public.record_link_click(p_link_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare destination text;
begin
  select url into destination from public.links where id = p_link_id and is_active = true;
  if destination is null then return null; end if;
  insert into public.link_clicks (link_id, profile_id, linktree_id)
  select id, user_id, linktree_id from public.links where id = p_link_id;
  return destination;
end;
$$;

revoke all on function public.record_page_view(uuid,text) from public;
revoke all on function public.record_link_click(uuid) from public;
grant execute on function public.record_page_view(uuid,text) to service_role;
grant execute on function public.record_link_click(uuid) to service_role;

