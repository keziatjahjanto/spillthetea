"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { MEDIA_BUCKET, MEDIA_TYPES } from "@/lib/posts";
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
  const imagePath = String(formData.get("imagePath") ?? "") || null;
  // Set when adding to your own thread; RLS checks you started that thread.
  const rootRaw = formData.get("threadRootId");
  const threadRootId = rootRaw ? Number(rootRaw) : null;
  if (threadRootId !== null && !Number.isInteger(threadRootId)) {
    return { error: "That thread doesn't exist." };
  }

  // With a picture, the text is optional.
  const invalid = imagePath
    ? content.length > MAX_LENGTH
      ? `Keep it to ${MAX_LENGTH} characters or fewer.`
      : null
    : validate(content);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Log in to post." };

  // The browser uploads the file; only accept a path in this user's own folder.
  if (imagePath && !isOwnMediaPath(imagePath, user.id)) {
    return { error: "That picture didn't upload properly. Try again." };
  }

  const { error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      content,
      image_path: imagePath,
      thread_root_id: threadRootId,
    });
  if (error) return { error: "Couldn't post. Try again." };

  // Feed, post pages, profiles and search all show posts and reply counts.
  revalidatePath("/", "layout");
  // The full-page composer sends people back to the feed. Only same-site paths.
  const redirectTo = String(formData.get("redirectTo") ?? "");
  if (redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
    redirect(redirectTo);
  }
  return { error: null, ok: true };
}

// <user id>/<uuid>.<image extension>, as the composer names uploads.
function isOwnMediaPath(path: string, userId: string) {
  const ext = Object.values(MEDIA_TYPES).join("|");
  return new RegExp(`^${userId}/[0-9a-f-]{36}\\.(${ext})$`).test(path);
}

export async function deletePost(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Deleting a thread's first post deletes its continuations too (cascade),
  // so collect their pictures first.
  const { data: continuations } = await supabase
    .from("posts")
    .select("image_path")
    .eq("thread_root_id", id)
    .eq("author_id", user.id)
    .not("image_path", "is", null);

  // RLS also blocks deleting someone else's post; the author check is a second guard.
  const { data: deleted } = await supabase
    .from("posts")
    .delete()
    .eq("id", id)
    .eq("author_id", user.id)
    .select("image_path, thread_root_id")
    .maybeSingle();

  // Remove the pictures too, so Storage doesn't fill with orphans.
  const images = [deleted?.image_path, ...(continuations ?? []).map((c) => c.image_path)]
    .filter((path): path is string => !!path);
  if (deleted && images.length > 0) {
    await supabase.storage.from(MEDIA_BUCKET).remove(images);
  }

  // Feed, post pages, profiles and search all show posts and reply counts.
  revalidatePath("/", "layout");
  // A deleted continuation returns to its thread; otherwise the post's page
  // is gone, so land on the feed.
  redirect(deleted?.thread_root_id ? `/post/${deleted.thread_root_id}` : "/");
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

  // Feed, post pages, profiles and search all show posts and reply counts.
  revalidatePath("/", "layout");
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

  // Feed, post pages, profiles and search all show posts and reply counts.
  revalidatePath("/", "layout");
}

export async function toggleLike(postId: number, isLiked: boolean) {
  if (!Number.isInteger(postId)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // RLS only allows liking/unliking as yourself.
  if (isLiked) {
    await supabase
      .from("likes")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);
  } else {
    await supabase.from("likes").insert({ user_id: user.id, post_id: postId });
  }

  // Like counts show on every post list, plus the Likes page.
  revalidatePath("/", "layout");
}

export async function toggleSave(postId: number, isSaved: boolean) {
  if (!Number.isInteger(postId)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // RLS keeps saves private and only lets you change your own.
  if (isSaved) {
    await supabase
      .from("saves")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);
  } else {
    await supabase.from("saves").insert({ user_id: user.id, post_id: postId });
  }

  revalidatePath("/", "layout");
}

export async function toggleRepost(postId: number, isReposted: boolean) {
  if (!Number.isInteger(postId)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // RLS only allows reposting/undoing as yourself.
  if (isReposted) {
    await supabase
      .from("reposts")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);
  } else {
    await supabase.from("reposts").insert({ user_id: user.id, post_id: postId });
  }

  // Repost counts show on every post list, plus profiles' Reposts tab.
  revalidatePath("/", "layout");
}
