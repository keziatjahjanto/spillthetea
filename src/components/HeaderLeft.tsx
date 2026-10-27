"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  BackIcon,
  BookmarkIcon,
  HeartIcon,
  HomeIcon,
  MenuIcon,
  UsersIcon,
} from "@/components/icons";

const buttonClass =
  "-ml-2 rounded-full p-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900";

// Top-left of the header: a menu on the home feed, a back button everywhere else.
export default function HeaderLeft({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();
  return pathname === "/" ? <HomeMenu loggedIn={loggedIn} /> : <BackButton />;
}

function BackButton() {
  const router = useRouter();

  function goBack() {
    // Opened from a shared link there's no history to go back to.
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  return (
    <button type="button" onClick={goBack} aria-label="Back" className={buttonClass}>
      <BackIcon />
    </button>
  );
}

function HomeMenu({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const feed = useSearchParams().get("feed");
  // Items that need an account send logged-out visitors to log in.
  const authed = (href: string) => (loggedIn ? href : "/login");

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items = [
    { href: "/", label: "For you", icon: HomeIcon, active: feed !== "following" },
    {
      href: authed("/?feed=following"),
      label: "Following",
      icon: UsersIcon,
      active: feed === "following",
    },
    { href: authed("/liked"), label: "Likes", icon: HeartIcon, active: false },
    { href: authed("/saved"), label: "Saved", icon: BookmarkIcon, active: false },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className={buttonClass}
      >
        <MenuIcon />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-2 w-48 overflow-hidden rounded-2xl border border-zinc-200 bg-background py-1 shadow-lg dark:border-zinc-800"
        >
          {items.map(({ href, label, icon: Icon, active }) => (
            <Link
              key={label}
              href={href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900 ${
                active ? "font-semibold" : ""
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
