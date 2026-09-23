import { timeAgo } from "@/lib/time";

export type Post = {
  id: number;
  content: string;
  created_at: string;
  profiles: { username: string } | null;
  replies: { count: number }[];
};

export default function PostCard({ post }: { post: Post }) {
  const username = post.profiles?.username ?? "unknown";
  const replyCount = post.replies[0]?.count ?? 0;

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
        </div>
        <p className="mt-1 whitespace-pre-wrap break-words">{post.content}</p>
        <p className="mt-2 text-sm text-zinc-500">
          {replyCount} {replyCount === 1 ? "reply" : "replies"}
        </p>
      </div>
    </article>
  );
}
