import Link from "next/link";

import { createPost } from "@/app/posts/actions";
import Composer from "@/components/Composer";
import PostCard, { type Post } from "@/components/PostCard";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data: posts, error } = await supabase
    .from("posts")
    .select(
      "id, author_id, content, created_at, profiles(username), replies(count)",
    )
    .order("created_at", { ascending: false })
    .returns<Post[]>();

  return (
    <main className="mx-auto w-full max-w-xl flex-1">
      {user ? (
        <Composer
          username={user.username}
          action={createPost}
          placeholder="What's the tea?"
          submitLabel="Post"
        />
      ) : (
        <p className="border-b border-zinc-200 px-4 py-4 text-center text-sm text-zinc-500 dark:border-zinc-800">
          <Link href="/login" className="font-semibold underline">
            Log in
          </Link>{" "}
          to spill some tea.
        </p>
      )}

      {error ? (
        <p className="px-4 py-8 text-center text-red-600">
          Couldn&apos;t load the feed: {error.message}
        </p>
      ) : posts.length === 0 ? (
        <p className="px-4 py-8 text-center text-zinc-500">
          No tea yet. Be the first to spill.
        </p>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post} currentUserId={user?.id} />
        ))
      )}
    </main>
  );
}
