import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export type CurrentUser = { id: string; username: string };

// The signed-in user with their profile username, or null when logged out.
// Cached per request: the header, bottom nav and page all ask for it.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  return { id: user.id, username: profile?.username ?? "unknown" };
});
