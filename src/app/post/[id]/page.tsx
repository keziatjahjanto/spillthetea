import Link from "next/link";
import { notFound } from "next/navigation";

import { createReply } from "@/app/posts/actions";
import Composer from "@/components/Composer";
import PostCard, { type Post } from "@/components/PostCard";
import ReplyCard, { type Reply } from "@/components/ReplyCard";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function PostPage(props: PageProps<"/post/[id]">) {
  const { id } = await props.params;
  const postId = Number(id);
  if (!Number.isInteger(postId)) notFound();

  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select(
      "id, author_id, content, created_at, profiles(username), replies(count)",
    )
    .eq("id", postId)
    .returns<Post[]>()
    .maybeSingle();
  if (!post) notFound();

  // Oldest first, so the conversation reads top to bottom.
  const { data: replies, error } = await supabase
    .from("replies")
    .select("id, post_id, author_id, content, created_at, profiles(username)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .returns<Reply[]>();

  return (
    <main className="mx-auto w-full max-w-xl flex-1">
      <PostCard post={post} currentUserId={user?.id} />

      {error ? (
        <p className="px-4 py-8 text-center text-red-600">
          Couldn&apos;t load replies: {error.message}
        </p>
      ) : (
        replies.map((reply) => (
          <ReplyCard key={reply.id} reply={reply} currentUserId={user?.id} />
        ))
      )}

      {user ? (
        <Composer
          username={user.username}
          action={createReply}
          placeholder={`Reply to @${post.profiles?.username ?? "unknown"}…`}
          submitLabel="Reply"
          postId={post.id}
        />
      ) : (
        <p className="px-4 py-4 text-center text-sm text-zinc-500">
          <Link href="/login" className="font-semibold underline">
            Log in
          </Link>{" "}
          to reply.
        </p>
      )}
    </main>
  );
}
