-- ============ TABLES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 20),
  display_name text check (char_length(display_name) <= 50),
  bio text check (char_length(bio) <= 160),
  instagram text check (instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  created_at timestamptz not null default now()
);

create table public.posts (
  id bigint generated always as identity primary key,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  image_path text, -- path inside the post-media Storage bucket
  -- Set on "add to thread" continuations: the thread's first post
  thread_root_id bigint references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Text or an image (text still at most 500 characters)
  constraint posts_content_check
    check (char_length(content) <= 500 and (char_length(content) >= 1 or image_path is not null))
);

create table public.replies (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

create table public.follows (
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table public.likes (
  user_id    uuid   not null references public.profiles(id) on delete cascade,
  post_id    bigint not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table public.saves (
  user_id    uuid   not null references public.profiles(id) on delete cascade,
  post_id    bigint not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table public.reposts (
  user_id    uuid   not null references public.profiles(id) on delete cascade,
  post_id    bigint not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create index reposts_post_id_idx on public.reposts (post_id);
create index likes_post_id_idx on public.likes (post_id);
create index follows_following_id_idx on public.follows (following_id);
create index posts_thread_root_id_idx on public.posts (thread_root_id, created_at);
create index posts_created_at_idx on public.posts (created_at desc);
create index replies_post_id_idx on public.replies (post_id, created_at);

-- ============ ROW LEVEL SECURITY ============
alter table public.profiles enable row level security;
alter table public.posts    enable row level security;
alter table public.replies  enable row level security;
alter table public.follows  enable row level security;
alter table public.likes    enable row level security;
alter table public.saves    enable row level security;
alter table public.reposts  enable row level security;

-- Anyone can read everything (it's a public feed)
create policy "profiles are public" on public.profiles for select using (true);
create policy "posts are public"    on public.posts    for select using (true);
create policy "replies are public"  on public.replies  for select using (true);
create policy "follows are public"  on public.follows  for select using (true);
create policy "likes are public"    on public.likes    for select using (true);
create policy "reposts are public"  on public.reposts  for select using (true);

-- Signed-in users can only write/delete as themselves
-- Continuations must point at a thread-starting post you wrote
create policy "insert own posts"   on public.posts   for insert to authenticated with check (
  (select auth.uid()) = author_id
  and (thread_root_id is null or exists (
    select 1 from public.posts root
    where root.id = posts.thread_root_id and root.author_id = (select auth.uid()) and root.thread_root_id is null
  ))
);
create policy "delete own posts"   on public.posts   for delete to authenticated using ((select auth.uid()) = author_id);
create policy "insert own replies" on public.replies for insert to authenticated with check ((select auth.uid()) = author_id);
create policy "delete own replies" on public.replies for delete to authenticated using ((select auth.uid()) = author_id);

-- Users can edit their own display name and bio, but not their username
create policy "update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
revoke update on public.profiles from authenticated, anon;
grant update (display_name, bio, instagram) on public.profiles to authenticated;

-- Users can follow and unfollow only as themselves
create policy "follow as yourself"   on public.follows for insert to authenticated with check ((select auth.uid()) = follower_id);
create policy "unfollow as yourself" on public.follows for delete to authenticated using ((select auth.uid()) = follower_id);

-- Users can like and unlike only as themselves
create policy "like as yourself"   on public.likes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "unlike as yourself" on public.likes for delete to authenticated using ((select auth.uid()) = user_id);

-- Saved posts are private: only the owner can see, add, or remove them
create policy "see own saves"      on public.saves for select to authenticated using ((select auth.uid()) = user_id);
create policy "save as yourself"   on public.saves for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "unsave as yourself" on public.saves for delete to authenticated using ((select auth.uid()) = user_id);

-- Users can repost and undo reposts only as themselves
create policy "repost as yourself"   on public.reposts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "unrepost as yourself" on public.reposts for delete to authenticated using ((select auth.uid()) = user_id);

-- ============ STORAGE: POST PICTURES AND GIFS ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-media', 'post-media', true, 5242880, array['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

-- Files live under <user id>/...; users can only add or remove their own
create policy "upload own post media" on storage.objects for insert to authenticated with check (bucket_id = 'post-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "delete own post media" on storage.objects for delete to authenticated using (bucket_id = 'post-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ============ AUTO-CREATE PROFILE ON SIGN UP ============
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
