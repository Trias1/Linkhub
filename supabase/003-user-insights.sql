drop policy if exists "Users read own page views" on public.page_views;
drop policy if exists "Users read own link clicks" on public.link_clicks;

create policy "Users read own page views"
on public.page_views for select
using (auth.uid() = profile_id);

create policy "Users read own link clicks"
on public.link_clicks for select
using (auth.uid() = profile_id);