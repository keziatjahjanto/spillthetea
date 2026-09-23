# Spill The Tea — Build Guide

A Threads-style app: post, read the feed, reply. Built in 8 steps. Push after every step.

**Stack:** Next.js (App Router, TypeScript, Tailwind) · Supabase (Postgres + Auth) · Vercel · GitHub (`keziatjahjanto/spillthetea`)

**Scope:** posts, a chronological feed, replies, accounts.
**Not building:** algorithmic recommendations, reposts/quotes, trending topics, DMs, advanced moderation. If the agent starts adding any of these, stop it.

**How to use this with Antigravity:** start every prompt with *"Read docs/BUILD_GUIDE.md first."* so the agent knows the plan and the limits. Do one step per agent conversation. Check the "Done when" list before you move on.

---

## Data model (3 tables)

| Table | Columns | Notes |
|---|---|---|
| `profiles` | `id` (= auth user id), `username`, `created_at` | Created automatically when someone signs up |
| `posts` | `id`, `author_id` → profiles, `content` (1–500 chars), `created_at` | The feed |
| `replies` | `id`, `post_id` → posts, `author_id` → profiles, `content`, `created_at` | Replies under a post |

Feed order: `posts.created_at` newest first. No ranking.

---

## Step 0 — Setup

- [x] Node.js 20+ installed (`node -v`)
- [x] Git installed, and the repo cloned with `origin` → `github.com/keziatjahjanto/spillthetea`
- [x] GitHub CLI logged in, with push access to the repo confirmed
- [x] Antigravity installed
- [x] **Vercel account:** sign up at [vercel.com](https://vercel.com) with **Continue with GitHub** so it can see the repo
- [x] **Supabase account:** sign up at [supabase.com](https://supabase.com), ideally also with GitHub. Don't create the project yet (that's Step 2).
- [x] Open this folder in Antigravity (**File → Open Folder** → `spillthetea`)

**Done when:** you're logged into Vercel and Supabase, and Antigravity has the repo open.

---

## Step 1 — Scaffold

**You do (manual):**
1. Open this folder in Antigravity.
2. After the agent finishes, go to [vercel.com/new](https://vercel.com/new), import `keziatjahjanto/spillthetea`, and click Deploy. Keep all the defaults.
3. In Vercel go to **Project → Settings → Deployment Protection** and turn **off** "Vercel Authentication". Otherwise visitors are sent to a Vercel login page instead of the app, and the Step 8 second account can't get in.

**Prompt for Antigravity:**
> Read docs/BUILD_GUIDE.md first. We're on Step 1. Scaffold a Next.js app in the **current folder** (not a subfolder) with `npx create-next-app@latest .` using TypeScript, ESLint, Tailwind, the App Router, the `src/` directory, and the default `@/*` import alias. If it refuses because of existing files, move `README.md` and `docs/` to a temp folder, scaffold, then move them back. Replace the default home page with a simple page that says "Spill The Tea ☕" and "Coming soon". Run `npm run build` to make sure it builds. Then commit and push to `main`.

**Done when:** the Vercel URL loads and shows "Spill The Tea ☕".

---

## Step 2 — Tables

**You do (manual):**
1. Create a project at [supabase.com](https://supabase.com). Save the database password somewhere.
2. Open **SQL Editor → New query**, paste the SQL below, and click Run.
3. Go to **Authentication → Sign In / Providers → Email** and turn **off** "Confirm email". This makes Step 8 testing much easier. You can turn it back on later.
4. Go to **Project Settings → API** (or **Connect**) and copy the **Project URL** and the **anon / publishable key**.
5. Add them to Vercel: **Project → Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Put the same two values in a local `.env.local` file in the repo root. Never commit this file. Next.js's `.gitignore` already ignores it.

```sql
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
```

**Done when:** **Table Editor** shows `profiles`, `posts`, and `replies`, and both env vars are set in Vercel and in `.env.local`.

---

## Step 3 — Core feature: the feed (from hand-typed rows)

**You do (manual), before prompting:**
1. **Authentication → Users → Add user → Create new user**. Use any email and password and tick "Auto confirm". The trigger creates a matching profile for them.
2. In the SQL Editor, add some tea:

```sql
update public.profiles set username = 'teamaster' where username like 'user_%';

insert into public.posts (author_id, content)
select id, c from public.profiles, unnest(array[
  'First sip of tea on Spill The Tea ☕',
  'Hot take: oat milk > regular milk',
  'Who else is building this weekend?'
]) as c
where username = 'teamaster';
```

**Prompt for Antigravity:**
> Read docs/BUILD_GUIDE.md first. We're on Step 3. Install `@supabase/supabase-js` and `@supabase/ssr`. Following the current official Supabase guide for Next.js App Router with `@supabase/ssr`, create `src/lib/supabase/server.ts` (server client using cookies) and `src/lib/supabase/client.ts` (browser client). Read the env vars `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Make the home page (`src/app/page.tsx`) a server component that fetches posts newest-first with `supabase.from('posts').select('id, content, created_at, profiles(username), replies(count)').order('created_at', { ascending: false })` and renders a Threads-like feed. Each post shows @username, relative time (e.g. "5m"), content, and reply count. Put the post card in its own component. Use a clean, centered, mobile-first single column in Tailwind. Do **not** add auth or forms yet. Run `npm run build`, then commit and push.

**Done when:** the Vercel URL shows your 3 hand-typed posts, newest first.

---

## Step 4 — Accounts

**You do (manual):** in Supabase go to **Authentication → URL Configuration**. Set **Site URL** to your Vercel URL and add `http://localhost:3000/**` and `https://<your-vercel-url>/**` to Redirect URLs.

**Prompt for Antigravity:**
> Read docs/BUILD_GUIDE.md first. We're on Step 4: accounts. Add the Supabase session-refresh middleware from the official `@supabase/ssr` Next.js guide. It's `src/middleware.ts`, or `src/proxy.ts` if this Next.js version uses the proxy convention. Create `/signup` with username, email, and password; pass the username in `options.data.username`, because a database trigger creates the profile from it. Create `/login` with email and password. Use server actions for sign up, sign in, and sign out. Add a top header on every page: the "Spill The Tea ☕" logo linking home, and either "Log in / Sign up" links or "@username · Sign out" when logged in. Show friendly error messages; if sign up fails with a database error, say the username may be taken. After signing in or up, redirect to `/`. Don't add posting yet. Run `npm run build`, then commit and push.

**Done when:** on the live site you can sign up, see your @username in the header, sign out, and sign back in. The new user also shows up in Supabase `profiles`.

---

## Step 5 — Creating posts

**Prompt for Antigravity:**
> Read docs/BUILD_GUIDE.md first. We're on Step 5: creating posts. At the top of the home feed, show a composer only when logged in: a textarea ("What's the tea?"), a live character counter out of 500, and a "Post" button. Submit it with a server action that gets the user from `supabase.auth.getUser()`, inserts into `posts` with `author_id = user.id`, and calls `revalidatePath('/')`. Reject empty or over-500-character posts on both the client and the server. Disable the button while pending and clear the form on success. When logged out, show a "Log in to spill some tea" prompt instead of the composer. Also add a delete button on posts the current user wrote. Run `npm run build`, then commit and push.

**You do (manual) after it works:** delete the hand-typed rows:

```sql
delete from public.posts where author_id = (select id from public.profiles where username = 'teamaster');
```

You can also delete the `teamaster` user under **Authentication → Users**.

**Done when:** you post from the live site, it appears at the top of the feed, and it's in the `posts` table.

---

## Step 6 — Third feature: replies (makes it multi-user)

**Prompt for Antigravity:**
> Read docs/BUILD_GUIDE.md first. We're on Step 6: replies. Make each post card link to `/post/[id]`. That page shows the original post at the top, then its replies oldest-first (`replies` with `profiles(username)`), then a reply form at the bottom for logged-in users. The form uses a server action that inserts into `replies` with `post_id` and `author_id = user.id`, then calls `revalidatePath` for both `/post/[id]` and `/`. Use the same 1–500 character validation. Show a 404 page for a missing post. Let users delete their own replies. The reply count on the feed should update. Run `npm run build`, then commit and push.

**Done when:** you can open a post, reply, and see the reply count go up on the feed.

---

## Step 7 — Deploy again (every step, not just now)

After every step:
1. `git push`
2. Watch the Vercel dashboard until the deploy is **Ready**. If it fails, open the build logs, paste the error into Antigravity, and fix it before moving on.
3. Test on the **live URL**, not just localhost.

Common problems:
- **Build fails on Vercel but works locally:** usually a TypeScript or ESLint error. Run `npm run build` locally.
- **"Invalid API key" / blank feed on Vercel:** the env vars are missing in Vercel. Add them and **Redeploy**.
- **Posting fails silently:** check RLS. The insert must send `author_id` equal to the logged-in user's id.

---

## Step 8 — A second account (the test that matters)

1. Open the live site in a **different browser** (or an incognito window).
2. Sign up as a new user, e.g. `@secondsip`.
3. Check each of these:
   - [ ] You see the first user's posts in the feed
   - [ ] You post as `@secondsip`, then refresh the first browser and see it
   - [ ] You reply to the first user's post, and the first user sees the reply after a refresh
   - [ ] No delete button appears on the other user's posts or replies
   - [ ] Signing out in one browser doesn't sign out the other

If all of these pass, you've shipped Spill The Tea. 🍵
