import { redirect } from "next/navigation";

import ComingSoon from "@/components/ComingSoon";
import { getCurrentUser } from "@/lib/auth";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <ComingSoon
      title="Notifications"
      message="Replies and likes on your posts will show up here soon."
    />
  );
}
