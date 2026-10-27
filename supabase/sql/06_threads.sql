-- "Add to thread": an author can continue their own post with more posts.
-- Continuations point at the thread's first post (thread_root_id).
-- Run once in the Supabase SQL Editor (kept out of supabase/migrations so the
-- Supabase GitHub integration does not re-run it). Already in ../schema.sql.

alter table public.posts
  add column thread_root_id bigint references public.posts(id) on delete cascade;

-- Loading a thread's continuations in order.
create index posts_thread_root_id_idx on public.posts (thread_root_id, created_at);

-- Replace the insert rule: still only as yourself, and a continuation must
-- point at a thread-starting post that you wrote.
drop policy "insert own posts" on public.posts;
create policy "insert own posts" on public.posts for insert to authenticated
  with check (
    (select auth.uid()) = author_id
    and (
      thread_root_id is null
      or exists (
        select 1 from public.posts root
        where root.id = posts.thread_root_id -- the new row (see 08_fix_thread_insert_policy.sql)
          and root.author_id = (select auth.uid())
          and root.thread_root_id is null
      )
    )
  );
