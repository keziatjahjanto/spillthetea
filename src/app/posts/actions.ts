"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

const MAX_POST_LENGTH = 500;

// `ok` flips on success so the composer knows to clear itself.
export type PostState = { error: string | null; ok?: boolean };

export async function createPost(
  _prev: PostState,
  formData: FormData,
): Promise<PostState> {
  const content = String(formData.get("content") ?? "").trim();

  if (!content) return { error: "Write something first." };
  if (content.length > MAX_POST_LENGTH) {
    return { error: `Posts can be at most ${MAX_POST_LENGTH} characters.` };
  }

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
}
