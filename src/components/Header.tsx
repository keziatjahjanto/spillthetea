import Link from "next/link";
import { Suspense } from "react";

import HeaderLeft from "@/components/HeaderLeft";
import { SearchIcon } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth";

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-background/90 backdrop-blur dark:border-zinc-800">
      <div className="mx-auto grid w-full max-w-xl grid-cols-[1fr_auto_1fr] items-center px-4 py-3">
        <div className="justify-self-start">
          {/* HeaderLeft reads the URL's search params, which needs Suspense. */}
          <Suspense>
            <HeaderLeft loggedIn={!!user} />
          </Suspense>
        </div>
        <Link href="/" className="text-lg font-bold tracking-tight">
          Spill The Tea ☕
        </Link>
        <nav className="flex items-center gap-3 justify-self-end text-sm">
          {!user && (
            <>
              <Link href="/login" className="hover:underline">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-zinc-900 px-3 py-1.5 font-semibold text-white dark:bg-white dark:text-zinc-900"
              >
                Sign up
              </Link>
            </>
          )}
          <Link
            href="/search"
            aria-label="Search"
            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          >
            <SearchIcon />
          </Link>
        </nav>
      </div>
    </header>
  );
}
