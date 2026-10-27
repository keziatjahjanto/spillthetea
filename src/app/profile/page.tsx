import { redirect } from "next/navigation";

import { signOut } from "@/app/auth/actions";
import { getCurrentUser } from "@/lib/auth";

// Minimal for now: who you are and a way to sign out. Becomes the full
// profile page (posts, bio) in a later step.
export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
      <div className="flex items-center gap-4">
        <div
          aria-hidden
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-amber-100 text-2xl font-semibold uppercase text-amber-900 dark:bg-amber-900 dark:text-amber-100"
        >
          {user.username[0]}
        </div>
        <h1 className="text-xl font-bold">@{user.username}</h1>
      </div>

      <form action={signOut} className="mt-8">
        <button
          type="submit"
          className="w-full rounded-xl border border-zinc-300 px-4 py-2 font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
