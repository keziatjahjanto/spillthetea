"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const MAX_LENGTH = 500;

// `ok` flips on success so the composer knows to clear itself.
export type PostState = { error: string | null; ok?: boolean };

// Shared 1–500 character check for posts and replies.
function validate(content: string): string | null {
  if (!content) return "Write something first.";
  if (content.length > MAX_LENGTH) {
    return `Keep it to ${MAX_LENGTH} characters or fewer.`;
  }
  return null;
}

export async function createPost(
  _prev: PostState,
  formData: FormData,
): Promise<PostState> {
  const content = String(formData.get("content") ?? "").trim();
  const invalid = validate(content);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Log in to post." };

  const { error } = await supabase
    .from("posts")
    .insert({ author_id: user.id, content });
  if (error) return { error: "Couldn't post. Try again." };

  revalidatePath("/");
  return { error: null, ok: true };
}

export async function deletePost(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // RLS also blocks deleting someone else's post; the author check is a second guard.
  await supabase.from("posts").delete().eq("id", id).eq("author_id", user.id);

  revalidatePath("/");
  // The post's own page no longer exists, so always land on the feed.
  redirect("/");
}

export async function createReply(
  _prev: PostState,
  formData: FormData,
): Promise<PostState> {
  const postId = Number(formData.get("postId"));
  if (!Number.isInteger(postId)) return { error: "That post doesn't exist." };

  const content = String(formData.get("content") ?? "").trim();
  const invalid = validate(content);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Log in to reply." };

  const { error } = await supabase
    .from("replies")
    .insert({ post_id: postId, author_id: user.id, content });
  if (error) return { error: "Couldn't reply. Try again." };

  revalidatePath(`/post/${postId}`);
  revalidatePath("/");
  return { error: null, ok: true };
}

export async function deleteReply(formData: FormData) {
  const id = Number(formData.get("id"));
  const postId = Number(formData.get("postId"));
  if (!Number.isInteger(id) || !Number.isInteger(postId)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("replies").delete().eq("id", id).eq("author_id", user.id);

  revalidatePath(`/post/${postId}`);
  revalidatePath("/");
}
