import { deleteReply } from "@/app/posts/actions";
import { timeAgo } from "@/lib/time";

export type Reply = {
  id: number;
  post_id: number;
  author_id: string;
  content: string;
  created_at: string;
  profiles: { username: string } | null;
};

type Props = { reply: Reply; currentUserId?: string };

export default function ReplyCard({ reply, currentUserId }: Props) {
  const username = reply.profiles?.username ?? "unknown";
  const isMine = currentUserId === reply.author_id;

  return (
    <article className="flex gap-3 border-b border-zinc-200 py-4 pl-8 pr-4 dark:border-zinc-800">
      <div
        aria-hidden
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold uppercase text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
      >
        {username[0]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold">@{username}</span>
          <time
            dateTime={reply.created_at}
            title={new Date(reply.created_at).toLocaleString()}
            className="text-sm text-zinc-500"
          >
            {timeAgo(reply.created_at)}
          </time>
          {isMine && (
            <form action={deleteReply} className="ml-auto">
              <input type="hidden" name="id" value={reply.id} />
              <input type="hidden" name="postId" value={reply.post_id} />
              <button
                type="submit"
                className="text-sm text-zinc-500 hover:text-red-600 hover:underline"
              >
                Delete
              </button>
            </form>
          )}
        </div>
        <p className="mt-1 whitespace-pre-wrap break-words">{reply.content}</p>
      </div>
    </article>
  );
}
