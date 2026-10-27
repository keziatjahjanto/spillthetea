import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

// Shortcut to your own public profile.
export default async function ProfilePage() {
  const user = await getCurrentUser();
  redirect(user ? `/u/${user.username}` : "/login");
}
