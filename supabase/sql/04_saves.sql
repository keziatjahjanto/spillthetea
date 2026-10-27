-- Saved posts (bookmarks). Private: only you can see, add, or remove your saves.
-- Run once in the Supabase SQL Editor (kept out of supabase/migrations so the
-- Supabase GitHub integration does not re-run it). Already in ../schema.sql.

create table public.saves (
  user_id    uuid   not null references public.profiles(id) on delete cascade,
  post_id    bigint not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

alter table public.saves enable row level security;

create policy "see own saves" on public.saves for select to authenticated using ((select auth.uid()) = user_id);
create policy "save as yourself" on public.saves for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "unsave as yourself" on public.saves for delete to authenticated using ((select auth.uid()) = user_id);
