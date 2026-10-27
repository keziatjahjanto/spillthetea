"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  label: string;
  // The section this tab represents, used for highlighting even when
  // `href` points to /login because the user is logged out.
  match: string;
  children: React.ReactNode;
};

export default function NavLink({ href, label, match, children }: Props) {
  const pathname = usePathname();
  const active = match === "/" ? pathname === "/" : pathname.startsWith(match);

  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`flex flex-1 items-center justify-center py-3 ${
        active
          ? "text-zinc-900 dark:text-white"
          : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
      }`}
    >
      {children}
    </Link>
  );
}
