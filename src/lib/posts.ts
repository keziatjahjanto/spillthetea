import { SUPABASE_URL } from "@/lib/supabase/config";

// Columns every post list needs: author, image, thread, and reply/like/repost counts.
export const POST_SELECT =
  "id, author_id, content, image_path, thread_root_id, created_at, profiles(username), replies(count), likes(count), reposts(count)";

// Pictures and GIFs live in this public Storage bucket under <user id>/<file>.
export const MEDIA_BUCKET = "post-media";
export const MAX_MEDIA_BYTES = 5 * 1024 * 1024;
export const MEDIA_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

export function mediaUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
}
