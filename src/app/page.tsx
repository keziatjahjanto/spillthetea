import PostCard, { type Post } from "@/components/PostCard";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, content, created_at, profiles(username), replies(count)")
    .order("created_at", { ascending: false })
    .returns<Post[]>();

  return (
    <main className="mx-auto w-full max-w-xl flex-1">
      <header className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
        <h1 className="text-xl font-bold tracking-tight">Spill The Tea ☕</h1>
      </header>

      {error ? (
        <p className="px-4 py-8 text-center text-red-600">
          Couldn&apos;t load the feed: {error.message}
          <br />
          <span className="text-xs text-zinc-500">
            Database: {process.env.NEXT_PUBLIC_SUPABASE_URL ?? "not set"}
          </span>
        </p>
      ) : posts.length === 0 ? (
        <p className="px-4 py-8 text-center text-zinc-500">
          No tea yet. Be the first to spill.
        </p>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </main>
  );
}
