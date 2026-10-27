-- Reposts (no quote posts): one row per (user, post). Public, change only your own.
-- Run once in the Supabase SQL Editor (kept out of supabase/migrations so the
-- Supabase GitHub integration does not re-run it). Already in ../schema.sql.

create table public.reposts (
  user_id    uuid   not null references public.profiles(id) on delete cascade,
  post_id    bigint not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- Repost counts per post (the primary key covers "what did X repost").
create index reposts_post_id_idx on public.reposts (post_id);

alter table public.reposts enable row level security;

create policy "reposts are public" on public.reposts for select using (true);
create policy "repost as yourself" on public.reposts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "unrepost as yourself" on public.reposts for delete to authenticated using ((select auth.uid()) = user_id);
