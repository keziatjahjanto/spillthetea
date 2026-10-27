-- Likes: one row per (user, post). Public counts, like/unlike only as yourself.
-- Run once in the Supabase SQL Editor (kept out of supabase/migrations so the
-- Supabase GitHub integration does not re-run it). Already in ../schema.sql.

create table public.likes (
  user_id    uuid   not null references public.profiles(id) on delete cascade,
  post_id    bigint not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- Like counts per post (the primary key already covers "what did I like").
create index likes_post_id_idx on public.likes (post_id);

alter table public.likes enable row level security;

create policy "likes are public" on public.likes for select using (true);
create policy "like as yourself" on public.likes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "unlike as yourself" on public.likes for delete to authenticated using ((select auth.uid()) = user_id);
