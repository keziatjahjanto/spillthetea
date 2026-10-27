import Link from "next/link";
import { notFound } from "next/navigation";

import { signOut } from "@/app/auth/actions";
import { toggleFollow } from "@/app/profile/actions";
import { InstagramIcon } from "@/components/icons";
import { type Post } from "@/components/PostCard";
import PostList from "@/components/PostList";
import ReplyCard, { type Reply } from "@/components/ReplyCard";
import { getCurrentUser } from "@/lib/auth";
import { POST_SELECT } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

export default async function UserPage(props: PageProps<"/u/[username]">) {
  const { username } = await props.params;
  const { tab } = await props.searchParams;
  const activeTab =
    tab === "replies" || tab === "media" || tab === "reposts"
      ? tab
      : ("posts" as const);

  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, instagram, created_at")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (profileError) {
    return (
      <p className="px-4 py-8 text-center text-red-600">
        Couldn&apos;t load this profile: {profileError.message}
      </p>
    );
  }
  if (!profile) notFound();

  const isMe = user?.id === profile.id;

  // Counts only (head: true skips fetching rows), plus whether I follow them.
  const [followers, following, mine] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", profile.id),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", profile.id),
    user && !isMe
      ? supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", user.id)
          .eq("following_id", profile.id)
          .maybeSingle()
      : null,
  ]);
  const followerCount = followers.count ?? 0;
  const followingCount = following.count ?? 0;
  const isFollowing = !!mine?.data;
  const joined = new Date(profile.created_at).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="mx-auto w-full max-w-xl flex-1">
      <section className="px-4 pb-4 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-bold">
              {profile.display_name ?? profile.username}
            </h1>
            <p className="text-zinc-500">@{profile.username}</p>
          </div>
          <div
            aria-hidden
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-amber-100 text-2xl font-semibold uppercase text-amber-900 dark:bg-amber-900 dark:text-amber-100"
          >
            {profile.username[0]}
          </div>
        </div>
        {profile.bio && (
          <p className="mt-3 whitespace-pre-wrap break-words">{profile.bio}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
          <span>
            <strong className="text-foreground">{followerCount}</strong>{" "}
            {followerCount === 1 ? "follower" : "followers"}
          </span>
          <span>
            <strong className="text-foreground">{followingCount}</strong>{" "}
            following
          </span>
          {profile.instagram && (
            <a
              href={`https://instagram.com/${profile.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground hover:underline"
            >
              <InstagramIcon className="h-4 w-4" />
              {profile.instagram}
            </a>
          )}
        </div>
        <p className="mt-1 text-sm text-zinc-500">Joined {joined}</p>

        {!isMe && (
          <div className="mt-4">
            {user ? (
              <form action={toggleFollow}>
                <input type="hidden" name="targetId" value={profile.id} />
                <input
                  type="hidden"
                  name="isFollowing"
                  value={String(isFollowing)}
                />
                <button
                  type="submit"
                  className={`w-full rounded-xl px-4 py-2 text-sm font-semibold ${
                    isFollowing
                      ? "border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                      : "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                className="block w-full rounded-xl bg-zinc-900 px-4 py-2 text-center text-sm font-semibold text-white dark:bg-white dark:text-zinc-900"
              >
                Follow
              </Link>
            )}
          </div>
        )}

        {isMe && (
          <div className="mt-4 flex gap-3">
            <Link
              href="/profile/edit"
              className="flex-1 rounded-xl border border-zinc-300 px-4 py-2 text-center text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Edit profile
            </Link>
            <form action={signOut} className="flex-1">
              <button
                type="submit"
                className="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                Sign out
              </button>
            </form>
          </div>
        )}
      </section>

      <nav className="flex border-b border-zinc-200 text-sm font-semibold dark:border-zinc-800">
        <Tab href={`/u/${profile.username}`} active={activeTab === "posts"}>
          Posts
        </Tab>
        <Tab
          href={`/u/${profile.username}?tab=replies`}
          active={activeTab === "replies"}
        >
          Replies
        </Tab>
        <Tab
          href={`/u/${profile.username}?tab=media`}
          active={activeTab === "media"}
        >
          Media
        </Tab>
        <Tab
          href={`/u/${profile.username}?tab=reposts`}
          active={activeTab === "reposts"}
        >
          Reposts
        </Tab>
      </nav>

      {activeTab === "replies" ? (
        <UserReplies authorId={profile.id} currentUserId={user?.id} />
      ) : activeTab === "reposts" ? (
        <UserReposts authorId={profile.id} currentUserId={user?.id} />
      ) : (
        <UserPosts
          authorId={profile.id}
          currentUserId={user?.id}
          mediaOnly={activeTab === "media"}
        />
      )}
    </main>
  );
}

function Tab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex-1 py-3 text-center ${
        active
          ? "border-b-2 border-zinc-900 dark:border-white"
          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

type ListProps = { authorId: string; currentUserId?: string };

// Media = only posts with a picture or GIF.
async function UserPosts({
  authorId,
  currentUserId,
  mediaOnly,
}: ListProps & { mediaOnly?: boolean }) {
  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("author_id", authorId);
  // Media shows every picture; Posts shows each thread once, by its first post.
  query = mediaOnly
    ? query.not("image_path", "is", null)
    : query.is("thread_root_id", null);
  const { data: posts, error } = await query
    .order("created_at", { ascending: false })
    .returns<Post[]>();

  if (error) {
    return (
      <p className="px-4 py-8 text-center text-red-600">
        Couldn&apos;t load posts: {error.message}
      </p>
    );
  }
  if (posts.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-zinc-500">
        {mediaOnly ? "No pictures or GIFs yet." : "No posts yet."}
      </p>
    );
  }
  return <PostList posts={posts} currentUserId={currentUserId} />;
}

async function UserReplies({ authorId, currentUserId }: ListProps) {
  const supabase = await createClient();
  const { data: replies, error } = await supabase
    .from("replies")
    .select("id, post_id, author_id, content, created_at, profiles(username)")
    .eq("author_id", authorId)
    .order("created_at", { ascending: false })
    .returns<Reply[]>();

  if (error) {
    return (
      <p className="px-4 py-8 text-center text-red-600">
        Couldn&apos;t load replies: {error.message}
      </p>
    );
  }
  if (replies.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-zinc-500">No replies yet.</p>
    );
  }
  return replies.map((reply) => (
    <ReplyCard
      key={reply.id}
      reply={reply}
      currentUserId={currentUserId}
      showPostLink
    />
  ));
}

// Posts this person reposted, most recently reposted first.
async function UserReposts({ authorId, currentUserId }: ListProps) {
  const supabase = await createClient();
  const { data: reposts, error } = await supabase
    .from("reposts")
    .select(`created_at, posts(${POST_SELECT})`)
    .eq("user_id", authorId)
    .order("created_at", { ascending: false })
    .returns<{ created_at: string; posts: Post | null }[]>();

  if (error) {
    return (
      <p className="px-4 py-8 text-center text-red-600">
        Couldn&apos;t load reposts: {error.message}
      </p>
    );
  }
  const posts = reposts.flatMap((r) => (r.posts ? [r.posts] : []));
  if (posts.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-zinc-500">No reposts yet.</p>
    );
  }
  return <PostList posts={posts} currentUserId={currentUserId} />;
}
