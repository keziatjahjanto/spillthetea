import PostCard, { type Post } from "@/components/PostCard";
import { createClient } from "@/lib/supabase/server";

type Props = {
  posts: Post[];
  currentUserId?: string;
  // On a thread's own page: link the posts with a line, no "more in thread".
  inThread?: boolean;
};

// Renders post cards, looking up thread sizes and which posts the viewer
// has liked, saved, and reposted in one query each rather than one per card.
export default async function PostList({
  posts,
  currentUserId,
  inThread,
}: Props) {
  let liked = new Set<number>();
  let saved = new Set<number>();
  let reposted = new Set<number>();
  const threadCounts = new Map<number, number>();
  if (posts.length === 0) return null;

  const supabase = await createClient();
  const ids = posts.map((p) => p.id);

  const { data: continuations } = await supabase
    .from("posts")
    .select("thread_root_id")
    .in("thread_root_id", ids);
  for (const { thread_root_id: root } of continuations ?? []) {
    if (root) threadCounts.set(root, (threadCounts.get(root) ?? 0) + 1);
  }

  if (currentUserId) {
    const [likes, saves, reposts] = await Promise.all([
      supabase
        .from("likes")
        .select("post_id")
        .eq("user_id", currentUserId)
        .in("post_id", ids),
      supabase
        .from("saves")
        .select("post_id")
        .eq("user_id", currentUserId)
        .in("post_id", ids),
      supabase
        .from("reposts")
        .select("post_id")
        .eq("user_id", currentUserId)
        .in("post_id", ids),
    ]);
    liked = new Set((likes.data ?? []).map((l) => l.post_id));
    saved = new Set((saves.data ?? []).map((s) => s.post_id));
    reposted = new Set((reposts.data ?? []).map((r) => r.post_id));
  }

  return posts.map((post, i) => (
    <PostCard
      key={post.id}
      post={post}
      currentUserId={currentUserId}
      likedByMe={liked.has(post.id)}
      savedByMe={saved.has(post.id)}
      repostedByMe={reposted.has(post.id)}
      threadCount={inThread ? 0 : (threadCounts.get(post.id) ?? 0)}
      threadLine={inThread && i < posts.length - 1}
    />
  ));
}
