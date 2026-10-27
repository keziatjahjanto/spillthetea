import { redirect } from "next/navigation";

import { type Post } from "@/components/PostCard";
import PostList from "@/components/PostList";
import { getCurrentUser } from "@/lib/auth";
import { POST_SELECT } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

// Posts you've liked, most recently liked first.
export default async function LikedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: likes, error } = await supabase
    .from("likes")
    .select(`created_at, posts(${POST_SELECT})`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<{ created_at: string; posts: Post | null }[]>();

  const posts = (likes ?? []).flatMap((l) => (l.posts ? [l.posts] : []));

  return (
    <main className="mx-auto w-full max-w-xl flex-1">
      <h1 className="border-b border-zinc-200 px-4 py-3 font-semibold dark:border-zinc-800">
        Likes
      </h1>
      {error ? (
        <p className="px-4 py-8 text-center text-red-600">
          Couldn&apos;t load your likes: {error.message}
        </p>
      ) : posts.length === 0 ? (
        <p className="px-4 py-8 text-center text-zinc-500">
          Posts you like will show up here. Tap the heart on any post.
        </p>
      ) : (
        <PostList posts={posts} currentUserId={user.id} />
      )}
    </main>
  );
}
