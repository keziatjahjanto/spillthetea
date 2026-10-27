import Link from "next/link";

import PostCard, { type Post } from "@/components/PostCard";
import { SearchIcon } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const LIMIT = 20;

// Escape LIKE wildcards so "100%" or "a_b" match literally.
function likePattern(q: string) {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

export default async function SearchPage(props: PageProps<"/search">) {
  const { q } = await props.searchParams;
  const query = (typeof q === "string" ? q : "").trim().slice(0, 100);

  return (
    <main className="mx-auto w-full max-w-xl flex-1">
      <form
        action="/search"
        role="search"
        className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800"
      >
        <label className="flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2 text-zinc-500 dark:bg-zinc-900">
          <SearchIcon className="h-5 w-5 shrink-0" />
          <input
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Search posts and people"
            aria-label="Search posts and people"
            autoFocus={!query}
            className="w-full bg-transparent text-foreground outline-none placeholder:text-zinc-500"
          />
        </label>
      </form>

      {query ? (
        <Results query={query} />
      ) : (
        <p className="px-4 py-8 text-center text-zinc-500">
          Find posts by what they say, or people by @username.
        </p>
      )}
    </main>
  );
}

async function Results({ query }: { query: string }) {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const pattern = likePattern(query);
  // "@tea" searches for the username "tea".
  const userPattern = likePattern(query.replace(/^@/, ""));

  const [people, posts] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username")
      .ilike("username", userPattern)
      .order("username")
      .limit(LIMIT),
    supabase
      .from("posts")
      .select(
        "id, author_id, content, created_at, profiles(username), replies(count)",
      )
      .ilike("content", pattern)
      .order("created_at", { ascending: false })
      .limit(LIMIT)
      .returns<Post[]>(),
  ]);

  if (people.error || posts.error) {
    return (
      <p className="px-4 py-8 text-center text-red-600">
        Couldn&apos;t search: {(people.error ?? posts.error)?.message}
      </p>
    );
  }

  if (people.data.length === 0 && posts.data.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-zinc-500">
        No tea found for &ldquo;{query}&rdquo;.
      </p>
    );
  }

  return (
    <>
      {people.data.length > 0 && (
        <section>
          <h2 className="px-4 pb-1 pt-4 text-sm font-semibold text-zinc-500">
            People
          </h2>
          {people.data.map((person) => (
            <Link
              key={person.id}
              href={`/u/${person.username}`}
              className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950"
            >
              <div
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold uppercase text-amber-900 dark:bg-amber-900 dark:text-amber-100"
              >
                {person.username[0]}
              </div>
              <span className="font-semibold">@{person.username}</span>
            </Link>
          ))}
        </section>
      )}

      {posts.data.length > 0 && (
        <section>
          <h2 className="px-4 pb-1 pt-4 text-sm font-semibold text-zinc-500">
            Posts
          </h2>
          {posts.data.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={user?.id} />
          ))}
        </section>
      )}
    </>
  );
}
