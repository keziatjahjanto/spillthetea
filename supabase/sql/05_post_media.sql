-- Pictures and GIFs on posts: a public Storage bucket plus an image column.
-- Run once in the Supabase SQL Editor (kept out of supabase/migrations so the
-- Supabase GitHub integration does not re-run it). Already in ../schema.sql.

-- Public bucket: anyone can view images. 5 MB max, images and GIFs only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-media', 'post-media', true, 5242880,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Uploads go in a folder named after the user's id: <user id>/<file>.
-- Users can only add or remove files in their own folder.
create policy "upload own post media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'post-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "delete own post media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'post-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- One image per post, stored as its path inside the bucket.
alter table public.posts add column image_path text;

-- Posts need text or an image (text still at most 500 characters).
alter table public.posts drop constraint posts_content_check;
alter table public.posts add constraint posts_content_check
  check (char_length(content) <= 500 and (char_length(content) >= 1 or image_path is not null));
