"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const MAX_NAME = 50;
const MAX_BIO = 160;

export type ProfileState = {
  error: string | null;
  values?: { displayName: string; bio: string };
};

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const values = { displayName, bio };

  if (displayName.length > MAX_NAME) {
    return { values, error: `Name can be at most ${MAX_NAME} characters.` };
  }
  if (bio.length > MAX_BIO) {
    return { values, error: `Bio can be at most ${MAX_BIO} characters.` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { values, error: "Log in to edit your profile." };

  // Empty fields are stored as null so the profile falls back to the username.
  const { data: profile, error } = await supabase
    .from("profiles")
    .update({ display_name: displayName || null, bio: bio || null })
    .eq("id", user.id)
    .select("username")
    .single();
  if (error) return { values, error: "Couldn't save. Try again." };

  revalidatePath(`/u/${profile.username}`);
  redirect(`/u/${profile.username}`);
}
