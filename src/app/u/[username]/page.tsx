import Link from "next/link";
import { notFound } from "next/navigation";

import { signOut } from "@/app/auth/actions";
import PostCard, { type Post } from "@/components/PostCard";
import ReplyCard, { type Reply } from "@/components/ReplyCard";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function UserPage(props: PageProps<"/u/[username]">) {
  const { username } = await props.params;
  const { tab } = await props.searchParams;
  const showReplies = tab === "replies";

  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, created_at")
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
        <p className="mt-3 text-sm text-zinc-500">Joined {joined}</p>

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
        <Tab href={`/u/${profile.username}`} active={!showReplies}>
          Posts
        </Tab>
        <Tab href={`/u/${profile.username}?tab=replies`} active={showReplies}>
          Replies
        </Tab>
      </nav>

      {showReplies ? (
        <UserReplies authorId={profile.id} currentUserId={user?.id} />
      ) : (
        <UserPosts authorId={profile.id} currentUserId={user?.id} />
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

async function UserPosts({ authorId, currentUserId }: ListProps) {
  const supabase = await createClient();
  const { data: posts, error } = await supabase
    .from("posts")
    .select(
      "id, author_id, content, created_at, profiles(username), replies(count)",
    )
    .eq("author_id", authorId)
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
    return <p className="px-4 py-8 text-center text-zinc-500">No posts yet.</p>;
  }
  return posts.map((post) => (
    <PostCard key={post.id} post={post} currentUserId={currentUserId} />
  ));
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
