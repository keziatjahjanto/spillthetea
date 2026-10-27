import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createPost, createReply } from "@/app/posts/actions";
import Composer from "@/components/Composer";
import { type Post } from "@/components/PostCard";
import PostList from "@/components/PostList";
import ReplyCard, { type Reply } from "@/components/ReplyCard";
import { getCurrentUser } from "@/lib/auth";
import { POST_SELECT } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

export default async function PostPage(props: PageProps<"/post/[id]">) {
  const { id } = await props.params;
  const postId = Number(id);
  if (!Number.isInteger(postId)) notFound();

  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("id", postId)
    .returns<Post[]>()
    .maybeSingle();
  if (!post) notFound();

  // A continuation lives on its thread's page, scrolled to that post.
  if (post.thread_root_id) {
    redirect(`/post/${post.thread_root_id}#post-${post.id}`);
  }

  // The rest of the thread and the replies, both oldest first.
  const [{ data: continuations }, { data: replies, error }] = await Promise.all(
    [
      supabase
        .from("posts")
        .select(POST_SELECT)
        .eq("thread_root_id", postId)
        .order("created_at", { ascending: true })
        .returns<Post[]>(),
      supabase
        .from("replies")
        .select(
          "id, post_id, author_id, content, created_at, profiles(username)",
        )
        .eq("post_id", postId)
        .order("created_at", { ascending: true })
        .returns<Reply[]>(),
    ],
  );
  const thread = [post, ...(continuations ?? [])];
  const isAuthor = user?.id === post.author_id;

  return (
    <main className="mx-auto w-full max-w-xl flex-1">
      {thread.length > 1 && (
        <p className="border-b border-zinc-200 px-4 py-2 text-sm text-zinc-500 dark:border-zinc-800">
          🧵 Thread · {thread.length} posts
        </p>
      )}
      <PostList posts={thread} currentUserId={user?.id} inThread />

      {isAuthor && user && (
        <Composer
          username={user.username}
          action={createPost}
          placeholder="Add to thread…"
          submitLabel="Add"
          threadRootId={post.id}
          mediaUserId={user.id}
        />
      )}

      <h2 className="border-b border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-500 dark:border-zinc-800">
        Replies
      </h2>
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
