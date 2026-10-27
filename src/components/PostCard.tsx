import Link from "next/link";

import { deletePost } from "@/app/posts/actions";
import { HeartIcon, RepostIcon } from "@/components/icons";
import LikeButton from "@/components/LikeButton";
import LinkifiedText from "@/components/LinkifiedText";
import MusicPlayer from "@/components/MusicPlayer";
import RepostButton from "@/components/RepostButton";
import SaveButton from "@/components/SaveButton";
import { firstMusicEmbed } from "@/lib/music";
import { mediaUrl } from "@/lib/posts";
import { timeAgo } from "@/lib/time";

export type Post = {
  id: number;
  author_id: string;
  content: string;
  image_path: string | null;
  thread_root_id: number | null;
  created_at: string;
  profiles: { username: string } | null;
  replies: { count: number }[];
  likes: { count: number }[];
  reposts: { count: number }[];
};

type Props = {
  post: Post;
  currentUserId?: string;
  likedByMe?: boolean;
  savedByMe?: boolean;
  repostedByMe?: boolean;
  // How many "add to thread" posts follow this one.
  threadCount?: number;
  // Draw a line down from the avatar to the next post in the thread.
  threadLine?: boolean;
};

export default function PostCard({
  post,
  currentUserId,
  likedByMe,
  savedByMe,
  repostedByMe,
  threadCount = 0,
  threadLine,
}: Props) {
  const username = post.profiles?.username ?? "unknown";
  const replyCount = post.replies[0]?.count ?? 0;
  const likeCount = post.likes[0]?.count ?? 0;
  const repostCount = post.reposts[0]?.count ?? 0;
  const isMine = currentUserId === post.author_id;
  const music = firstMusicEmbed(post.content);

  return (
    <article
      id={`post-${post.id}`}
      className={`relative flex gap-3 px-4 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-950 ${
        threadLine ? "" : "border-b border-zinc-200 dark:border-zinc-800"
      }`}
    >
      {/* Stretched link: the whole card opens the post. Links and buttons
          inside sit above it (relative z-10) so they stay clickable. */}
      <Link
        href={`/post/${post.id}`}
        aria-label={`Open post by @${username}`}
        className="absolute inset-0"
      />
      <div className="flex shrink-0 flex-col items-center">
        <div
          aria-hidden
          className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold uppercase text-amber-900 dark:bg-amber-900 dark:text-amber-100"
        >
          {username[0]}
        </div>
        {threadLine && (
          <div
            aria-hidden
            className="-mb-4 mt-1 w-0.5 flex-1 bg-zinc-200 dark:bg-zinc-800"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <Link
            href={`/u/${username}`}
            className="relative z-10 font-semibold hover:underline"
          >
            @{username}
          </Link>
          <time
            dateTime={post.created_at}
            title={new Date(post.created_at).toLocaleString()}
            className="text-sm text-zinc-500"
          >
            {timeAgo(post.created_at)}
          </time>
          {isMine && (
            <form action={deletePost} className="relative z-10 ml-auto">
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
        {post.content && (
          <p className="mt-1 whitespace-pre-wrap break-words">
            <LinkifiedText text={post.content} />
          </p>
        )}
        {music && <MusicPlayer embed={music} />}
        {post.image_path && (
          // Plain <img>: GIFs must stay animated, and Vercel's image optimizer
          // has a small free quota. Images are capped at 5 MB on upload.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(post.image_path)}
            alt={`Image posted by @${username}`}
            loading="lazy"
            className="mt-2 max-h-[28rem] rounded-xl border border-zinc-200 dark:border-zinc-800"
          />
        )}
        <div className="mt-2 flex items-center gap-5 text-sm text-zinc-500">
          {currentUserId ? (
            <LikeButton
              postId={post.id}
              liked={!!likedByMe}
              count={likeCount}
            />
          ) : (
            <Link
              href="/login"
              aria-label="Log in to like"
              className="relative z-10 flex items-center gap-1 hover:text-red-600"
            >
              <HeartIcon className="h-5 w-5" />
              {likeCount > 0 && likeCount}
            </Link>
          )}
          {currentUserId ? (
            <RepostButton
              postId={post.id}
              reposted={!!repostedByMe}
              count={repostCount}
            />
          ) : (
            <Link
              href="/login"
              aria-label="Log in to repost"
              className="relative z-10 flex items-center gap-1 hover:text-emerald-600"
            >
              <RepostIcon className="h-5 w-5" />
              {repostCount > 0 && repostCount}
            </Link>
          )}
          <span>
            {replyCount} {replyCount === 1 ? "reply" : "replies"}
          </span>
          {threadCount > 0 && (
            <span>
              🧵 {threadCount} more in thread
            </span>
          )}
          {currentUserId && (
            <span className="ml-auto flex">
              <SaveButton postId={post.id} saved={!!savedByMe} />
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
