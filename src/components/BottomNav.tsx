import {
  HeartIcon,
  HomeIcon,
  MessageIcon,
  PlusIcon,
  UserIcon,
} from "@/components/icons";
import NavLink from "@/components/NavLink";
import { getCurrentUser } from "@/lib/auth";

export default async function BottomNav() {
  const user = await getCurrentUser();
  // Tabs that need an account send logged-out visitors to log in instead.
  const authed = (href: string) => (user ? href : "/login");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-200 bg-background/90 backdrop-blur dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-xl">
        <NavLink href="/" label="Home" match="/">
          <HomeIcon />
        </NavLink>
        <NavLink href="/messages" label="Messages" match="/messages">
          <MessageIcon />
        </NavLink>
        <NavLink href={authed("/compose")} label="Add post" match="/compose">
          <PlusIcon className="h-7 w-7" />
        </NavLink>
        <NavLink
          href={authed("/notifications")}
          label="Notifications"
          match="/notifications"
        >
          <HeartIcon />
        </NavLink>
        <NavLink
          href={user ? `/u/${user.username}` : "/login"}
          label="Profile"
          match={user ? `/u/${user.username}` : "/profile"}
        >
          <UserIcon />
        </NavLink>
      </div>
    </nav>
  );
}
