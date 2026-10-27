import Link from "next/link";
import { redirect } from "next/navigation";

import {
  HeartIcon,
  MessageIcon,
  RepostIcon,
  UserIcon,
} from "@/components/icons";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/time";

const PER_KIND = 30;

type Kind = "reply" | "like" | "repost" | "follow";

type Notification = {
  key: string;
  kind: Kind;
  createdAt: string;
  actor: string;
  postId?: number;
  // The reply text, or the post that was liked/reposted.
  snippet?: string;
};

type Actor = { username: string } | null;
type PostRef = { content: string } | null;

// Activity on your posts and profile, built from existing tables (no
// separate notifications table): replies, likes, reposts, and new followers.
export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  // posts!inner + a filter on posts.author_id = "only rows on my posts".
  const [replies, likes, reposts, follows] = await Promise.all([
    supabase
      .from("replies")
      .select(
        "id, created_at, content, post_id, profiles(username), posts!inner(author_id)",
      )
      .eq("posts.author_id", user.id)
      .neq("author_id", user.id)
      .order("created_at", { ascending: false })
      .limit(PER_KIND)
      .returns<
        {
          id: number;
          created_at: string;
          content: string;
          post_id: number;
          profiles: Actor;
        }[]
      >(),
    supabase
      .from("likes")
      .select(
        "created_at, post_id, user_id, profiles(username), posts!inner(author_id, content)",
      )
      .eq("posts.author_id", user.id)
      .neq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(PER_KIND)
      .returns<
        {
          created_at: string;
          post_id: number;
          user_id: string;
          profiles: Actor;
          posts: PostRef;
        }[]
      >(),
    supabase
      .from("reposts")
      .select(
        "created_at, post_id, user_id, profiles(username), posts!inner(author_id, content)",
      )
      .eq("posts.author_id", user.id)
      .neq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(PER_KIND)
      .returns<
        {
          created_at: string;
          post_id: number;
          user_id: string;
          profiles: Actor;
          posts: PostRef;
        }[]
      >(),
    supabase
      .from("follows")
      .select("created_at, follower_id, profiles!follower_id(username)")
      .eq("following_id", user.id)
      .order("created_at", { ascending: false })
      .limit(PER_KIND)
      .returns<
        { created_at: string; follower_id: string; profiles: Actor }[]
      >(),
  ]);

  const error = replies.error ?? likes.error ?? reposts.error ?? follows.error;

  const items: Notification[] = [
    ...(replies.data ?? []).map((r) => ({
      key: `reply-${r.id}`,
      kind: "reply" as const,
      createdAt: r.created_at,
      actor: r.profiles?.username ?? "unknown",
      postId: r.post_id,
      snippet: r.content,
    })),
    ...(likes.data ?? []).map((l) => ({
      key: `like-${l.user_id}-${l.post_id}`,
      kind: "like" as const,
      createdAt: l.created_at,
      actor: l.profiles?.username ?? "unknown",
      postId: l.post_id,
      snippet: l.posts?.content,
    })),
    ...(reposts.data ?? []).map((r) => ({
      key: `repost-${r.user_id}-${r.post_id}`,
      kind: "repost" as const,
      createdAt: r.created_at,
      actor: r.profiles?.username ?? "unknown",
      postId: r.post_id,
      snippet: r.posts?.content,
    })),
    ...(follows.data ?? []).map((f) => ({
      key: `follow-${f.follower_id}`,
      kind: "follow" as const,
      createdAt: f.created_at,
      actor: f.profiles?.username ?? "unknown",
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <main className="mx-auto w-full max-w-xl flex-1">
      <h1 className="border-b border-zinc-200 px-4 py-3 font-semibold dark:border-zinc-800">
        Notifications
      </h1>
      {error ? (
        <p className="px-4 py-8 text-center text-red-600">
          Couldn&apos;t load notifications: {error.message}
        </p>
      ) : items.length === 0 ? (
        <p className="px-4 py-8 text-center text-zinc-500">
          Nothing yet. Replies, likes, reposts, and new followers will show up
          here.
        </p>
      ) : (
        items.map((item) => <NotificationRow key={item.key} item={item} />)
      )}
    </main>
  );
}

const KINDS: Record<Kind, { text: string; icon: typeof HeartIcon; color: string }> = {
  reply: { text: "replied to your post", icon: MessageIcon, color: "text-sky-600" },
  like: { text: "liked your post", icon: HeartIcon, color: "text-red-600" },
  repost: { text: "reposted your post", icon: RepostIcon, color: "text-emerald-600" },
  follow: { text: "started following you", icon: UserIcon, color: "text-amber-600" },
};

function NotificationRow({ item }: { item: Notification }) {
  const { text, icon: Icon, color } = KINDS[item.kind];
  // Post activity opens the post; a new follower opens their profile.
  const href = item.postId ? `/post/${item.postId}` : `/u/${item.actor}`;

  return (
    <Link
      href={href}
      className="flex gap-3 border-b border-zinc-200 px-4 py-3 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950"
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
      <div className="min-w-0 flex-1">
        <p>
          <span className="font-semibold">@{item.actor}</span> {text}
          <span className="text-sm text-zinc-500">
            {" "}
            · {timeAgo(item.createdAt)}
          </span>
        </p>
        {item.snippet && (
          <p className="mt-0.5 truncate text-sm text-zinc-500">
            {item.snippet}
          </p>
        )}
      </div>
    </Link>
  );
}
