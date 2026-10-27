-- Profile details: optional display name and bio, editable by the owner only.
-- Run once in the Supabase SQL Editor (kept out of supabase/migrations so the
-- Supabase GitHub integration does not re-run it). Already in ../schema.sql.

alter table public.profiles
  add column display_name text check (char_length(display_name) <= 50),
  add column bio text check (char_length(bio) <= 160);

-- Owners can update their own row...
create policy "update own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ...but only these two columns, so usernames can't be changed via the API.
revoke update on public.profiles from authenticated, anon;
grant update (display_name, bio) on public.profiles to authenticated;
