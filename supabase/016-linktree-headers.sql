create table if not exists public.linktree_headers (
  linktree_id uuid primary key references public.linktrees(id) on delete cascade,
  title text not null default 'My Linktree' check (char_length(title) between 1 and 60),
  bio text not null default '' check (char_length(bio) <= 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.linktree_headers (linktree_id, title, bio)
select id, coalesce(nullif(name, ''), 'My Linktree'), coalesce(bio, '')
from public.linktrees
on conflict (linktree_id) do nothing;

create or replace function public.create_linktree_header()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.linktree_headers (linktree_id, title, bio)
  values (new.id, coalesce(nullif(new.name, ''), 'My Linktree'), coalesce(new.bio, ''));
  return new;
end;
$$;
drop trigger if exists create_linktree_header_trigger on public.linktrees;
create trigger create_linktree_header_trigger after insert on public.linktrees for each row execute procedure public.create_linktree_header();

alter table public.linktree_headers enable row level security;
drop policy if exists "Linktree headers are public" on public.linktree_headers;
drop policy if exists "Owners create Linktree headers" on public.linktree_headers;
drop policy if exists "Owners update Linktree headers" on public.linktree_headers;
drop policy if exists "Owners delete Linktree headers" on public.linktree_headers;
create policy "Linktree headers are public" on public.linktree_headers for select using (true);
create policy "Owners create Linktree headers" on public.linktree_headers for insert with check (exists (select 1 from public.linktrees where id = linktree_id and owner_id = auth.uid()));
create policy "Owners update Linktree headers" on public.linktree_headers for update using (exists (select 1 from public.linktrees where id = linktree_id and owner_id = auth.uid())) with check (exists (select 1 from public.linktrees where id = linktree_id and owner_id = auth.uid()));
create policy "Owners delete Linktree headers" on public.linktree_headers for delete using (exists (select 1 from public.linktrees where id = linktree_id and owner_id = auth.uid()));

create or replace function public.touch_linktree_header()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists touch_linktree_header_trigger on public.linktree_headers;
create trigger touch_linktree_header_trigger before update on public.linktree_headers for each row execute procedure public.touch_linktree_header();

grant select on public.linktree_headers to anon, authenticated;
grant insert, update, delete on public.linktree_headers to authenticated;
