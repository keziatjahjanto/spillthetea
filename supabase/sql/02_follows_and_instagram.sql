-- Follows (who follows whom) and an optional Instagram handle on profiles.
-- Run once in the Supabase SQL Editor (kept out of supabase/migrations so the
-- Supabase GitHub integration does not re-run it). Already in ../schema.sql.

create table public.follows (
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- "Who follows X" lookups (the primary key already covers "who does X follow").
create index follows_following_id_idx on public.follows (following_id);

alter table public.follows enable row level security;

create policy "follows are public" on public.follows for select using (true);
create policy "follow as yourself" on public.follows for insert to authenticated with check ((select auth.uid()) = follower_id);
create policy "unfollow as yourself" on public.follows for delete to authenticated using ((select auth.uid()) = follower_id);

-- Instagram username only (no URL): letters, numbers, dots, underscores.
alter table public.profiles
  add column instagram text check (instagram ~ '^[A-Za-z0-9._]{1,30}$');

-- Let owners edit it alongside display name and bio.
grant update (display_name, bio, instagram) on public.profiles to authenticated;
