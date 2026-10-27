import Link from "next/link";
import { redirect } from "next/navigation";

import { createPost } from "@/app/posts/actions";
import Composer from "@/components/Composer";
import { type Post } from "@/components/PostCard";
import PostList from "@/components/PostList";
import { getCurrentUser } from "@/lib/auth";
import { POST_SELECT } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

export default async function Home(props: PageProps<"/">) {
  const { feed } = await props.searchParams;
  const following = feed === "following";

  const user = await getCurrentUser();
  if (following && !user) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-xl flex-1">
      <FeedTabs following={following} loggedIn={!!user} />

      {user ? (
        <Composer
          username={user.username}
          action={createPost}
          placeholder="What's the tea?"
          submitLabel="Post"
          mediaUserId={user.id}
        />
      ) : (
        <p className="border-b border-zinc-200 px-4 py-4 text-center text-sm text-zinc-500 dark:border-zinc-800">
          <Link href="/login" className="font-semibold underline">
            Log in
          </Link>{" "}
          to spill some tea.
        </p>
      )}

      {following && user ? (
        <FollowingFeed userId={user.id} />
      ) : (
        <Feed currentUserId={user?.id} />
      )}
    </main>
  );
}

// Following = posts from people you follow, newest first.
async function FollowingFeed({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data: follows, error } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  if (error) {
    return (
      <p className="px-4 py-8 text-center text-red-600">
        Couldn&apos;t load the feed: {error.message}
      </p>
    );
  }
  if (follows.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-zinc-500">
        You&apos;re not following anyone yet. Tap an @username, then Follow.
      </p>
    );
  }
  return (
    <Feed
      currentUserId={userId}
      authorIds={follows.map((f) => f.following_id)}
    />
  );
}

// For you = everyone's posts, newest first. No ranking, by design.
// With authorIds, only those people's posts (the Following feed).
async function Feed({
  currentUserId,
  authorIds,
}: {
  currentUserId?: string;
  authorIds?: string[];
}) {
  const supabase = await createClient();
  // Threads show once, by their first post.
  let query = supabase
    .from("posts")
    .select(POST_SELECT)
    .is("thread_root_id", null);
  if (authorIds) query = query.in("author_id", authorIds);
  const { data: posts, error } = await query
    .order("created_at", { ascending: false })
    .returns<Post[]>();

  if (error) {
    return (
      <p className="px-4 py-8 text-center text-red-600">
        Couldn&apos;t load the feed: {error.message}
      </p>
    );
  }
  if (posts.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-zinc-500">
        No tea yet. Be the first to spill.
      </p>
    );
  }
  return <PostList posts={posts} currentUserId={currentUserId} />;
}

function FeedTabs({
  following,
  loggedIn,
}: {
  following: boolean;
  loggedIn: boolean;
}) {
  const tab = (active: boolean) =>
    `flex-1 py-3 text-center ${
      active
        ? "border-b-2 border-zinc-900 dark:border-white"
        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
    }`;

  return (
    <nav className="flex border-b border-zinc-200 text-sm font-semibold dark:border-zinc-800">
      <Link href="/" aria-current={!following ? "page" : undefined} className={tab(!following)}>
        For you
      </Link>
      <Link
        href={loggedIn ? "/?feed=following" : "/login"}
        aria-current={following ? "page" : undefined}
        className={tab(following)}
      >
        Following
      </Link>
    </nav>
  );
}
