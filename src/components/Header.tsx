import Link from "next/link";

import { signOut } from "@/app/auth/actions";
import { getCurrentUser } from "@/lib/auth";

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-background/90 backdrop-blur dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Spill The Tea ☕
        </Link>
        {user ? (
          <form action={signOut} className="flex items-center gap-3 text-sm">
            <span className="font-semibold">@{user.username}</span>
            <button type="submit" className="text-zinc-500 hover:underline">
              Sign out
            </button>
          </form>
        ) : (
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/login" className="hover:underline">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-zinc-900 px-3 py-1.5 font-semibold text-white dark:bg-white dark:text-zinc-900"
            >
              Sign up
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
