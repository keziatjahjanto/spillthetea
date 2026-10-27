-- Fix for 06_threads.sql: "Add to thread" was always rejected.
-- Inside the policy's subquery, a bare thread_root_id meant root.thread_root_id
-- (the existing post), not the new row's, so the check could never pass.
-- posts.thread_root_id names the row being inserted.
-- Run once in the Supabase SQL Editor. Already in ../schema.sql.

drop policy "insert own posts" on public.posts;
create policy "insert own posts" on public.posts for insert to authenticated
  with check (
    (select auth.uid()) = author_id
    and (
      thread_root_id is null
      or exists (
        select 1 from public.posts root
        where root.id = posts.thread_root_id
          and root.author_id = (select auth.uid())
          and root.thread_root_id is null
      )
    )
  );
