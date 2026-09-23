-- ============ TABLES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 20),
  created_at timestamptz not null default now()
);

create table public.posts (
  id bigint generated always as identity primary key,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

create table public.replies (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

create index posts_created_at_idx on public.posts (created_at desc);
create index replies_post_id_idx on public.replies (post_id, created_at);

-- ============ ROW LEVEL SECURITY ============
alter table public.profiles enable row level security;
alter table public.posts    enable row level security;
alter table public.replies  enable row level security;

-- Anyone can read everything (it's a public feed)
create policy "profiles are public" on public.profiles for select using (true);
create policy "posts are public"    on public.posts    for select using (true);
create policy "replies are public"  on public.replies  for select using (true);

-- Signed-in users can only write/delete as themselves
create policy "insert own posts"   on public.posts   for insert to authenticated with check ((select auth.uid()) = author_id);
create policy "delete own posts"   on public.posts   for delete to authenticated using ((select auth.uid()) = author_id);
create policy "insert own replies" on public.replies for insert to authenticated with check ((select auth.uid()) = author_id);
create policy "delete own replies" on public.replies for delete to authenticated using ((select auth.uid()) = author_id);

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
