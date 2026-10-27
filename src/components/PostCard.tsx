import Link from "next/link";

import { deletePost } from "@/app/posts/actions";
import { timeAgo } from "@/lib/time";

export type Post = {
  id: number;
  author_id: string;
  content: string;
  created_at: string;
  profiles: { username: string } | null;
  replies: { count: number }[];
};

type Props = { post: Post; currentUserId?: string };

export default function PostCard({ post, currentUserId }: Props) {
  const username = post.profiles?.username ?? "unknown";
  const replyCount = post.replies[0]?.count ?? 0;
  const isMine = currentUserId === post.author_id;

  return (
    <article className="flex gap-3 border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
      <div
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold uppercase text-amber-900 dark:bg-amber-900 dark:text-amber-100"
      >
        {username[0]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold">@{username}</span>
          <time
            dateTime={post.created_at}
            title={new Date(post.created_at).toLocaleString()}
            className="text-sm text-zinc-500"
          >
            {timeAgo(post.created_at)}
          </time>
          {isMine && (
            <form action={deletePost} className="ml-auto">
              <input type="hidden" name="id" value={post.id} />
              <button
                type="submit"
                className="text-sm text-zinc-500 hover:text-red-600 hover:underline"
              >
                Delete
              </button>
            </form>
          )}
        </div>
        <Link href={`/post/${post.id}`} className="block">
          <p className="mt-1 whitespace-pre-wrap break-words">{post.content}</p>
          <p className="mt-2 text-sm text-zinc-500 hover:underline">
            {replyCount} {replyCount === 1 ? "reply" : "replies"}
          </p>
        </Link>
      </div>
    </article>
  );
}
