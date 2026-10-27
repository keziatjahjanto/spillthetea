"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const MAX_NAME = 50;
const MAX_BIO = 160;
const INSTAGRAM_RE = /^[A-Za-z0-9._]{1,30}$/;

export type ProfileState = {
  error: string | null;
  values?: { displayName: string; bio: string; instagram: string };
};

// Accept "@name", "name", or a pasted instagram.com/name link; keep just the name.
function instagramHandle(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/[/?].*$/, "");
}

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const instagram = instagramHandle(String(formData.get("instagram") ?? ""));
  const values = { displayName, bio, instagram };

  if (displayName.length > MAX_NAME) {
    return { values, error: `Name can be at most ${MAX_NAME} characters.` };
  }
  if (bio.length > MAX_BIO) {
    return { values, error: `Bio can be at most ${MAX_BIO} characters.` };
  }
  if (instagram && !INSTAGRAM_RE.test(instagram)) {
    return {
      values,
      error: "Instagram usernames use letters, numbers, dots, and _ only.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { values, error: "Log in to edit your profile." };

  // Empty fields are stored as null so the profile falls back to the username.
  const { data: profile, error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName || null,
      bio: bio || null,
      instagram: instagram || null,
    })
    .eq("id", user.id)
    .select("username")
    .single();
  if (error) return { values, error: "Couldn't save. Try again." };

  revalidatePath(`/u/${profile.username}`);
  redirect(`/u/${profile.username}`);
}

export async function toggleFollow(formData: FormData) {
  const targetId = String(formData.get("targetId") ?? "");
  const isFollowing = formData.get("isFollowing") === "true";
  if (!targetId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id === targetId) return;

  // RLS only allows following/unfollowing as yourself.
  if (isFollowing) {
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", targetId);
  } else {
    await supabase
      .from("follows")
      .insert({ follower_id: user.id, following_id: targetId });
  }

  // Counts show on profiles and the Following feed changes.
  revalidatePath("/", "layout");
}
