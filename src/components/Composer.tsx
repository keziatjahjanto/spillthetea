"use client";

import { useActionState, useRef, useState } from "react";

import type { PostState } from "@/app/posts/actions";
import { ImageIcon, MusicIcon } from "@/components/icons";
import { musicEmbed } from "@/lib/music";
import { MAX_MEDIA_BYTES, MEDIA_BUCKET, MEDIA_TYPES } from "@/lib/posts";
import { createClient } from "@/lib/supabase/client";

const MAX_LENGTH = 500;

type Media = { path: string; previewUrl: string } | null;

type Props = {
  username: string;
  action: (prev: PostState, formData: FormData) => Promise<PostState>;
  placeholder: string;
  submitLabel: string;
  // Set when replying, so the action knows which post the reply belongs to.
  postId?: number;
  // Set when adding to your own thread: the thread's first post.
  threadRootId?: number;
  // Where to go after a successful post (e.g. back to the feed).
  redirectTo?: string;
  autoFocus?: boolean;
  // Set to allow attaching a picture or GIF; uploads go in this user's folder.
  mediaUserId?: string;
};

export default function Composer({
  username,
  action,
  placeholder,
  submitLabel,
  postId,
  threadRootId,
  redirectTo,
  autoFocus,
  mediaUserId,
}: Props) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<Media>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [musicOpen, setMusicOpen] = useState(false);
  const [musicLink, setMusicLink] = useState("");
  const [musicError, setMusicError] = useState<string | null>(null);
  const [lastState, setLastState] = useState(state);
  const fileInput = useRef<HTMLInputElement>(null);

  // Clear the form once a post goes through.
  if (state !== lastState) {
    setLastState(state);
    if (state.ok) {
      setContent("");
      setMedia(null);
    }
  }

  // Upload straight from the browser to Supabase Storage (avoids sending
  // big files through our server), then post with just the file's path.
  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be picked again
    if (!file || !mediaUserId) return;

    const ext = MEDIA_TYPES[file.type];
    if (!ext) return setUploadError("Use a JPG, PNG, GIF, or WebP image.");
    if (file.size > MAX_MEDIA_BYTES) {
      return setUploadError("Images can be at most 5 MB.");
    }

    setUploadError(null);
    setUploading(true);
    const path = `${mediaUserId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await createClient()
      .storage.from(MEDIA_BUCKET)
      .upload(path, file, { contentType: file.type });
    setUploading(false);

    if (error) return setUploadError("Couldn't upload that image. Try again.");
    setMedia({ path, previewUrl: URL.createObjectURL(file) });
  }

  // Music is just a link in the text; the post shows the player for it.
  function addMusic() {
    const link = musicLink.trim();
    if (!musicEmbed(link)) {
      return setMusicError("Paste a Spotify or Apple Music link.");
    }
    setContent((c) => (c.trim() ? `${c.trimEnd()}\n${link}` : link));
    setMusicLink("");
    setMusicError(null);
    setMusicOpen(false);
  }

  const length = content.trim().length;
  const tooLong = length > MAX_LENGTH;
  const empty = length === 0 && !media;

  return (
    <form
      action={formAction}
      className="flex gap-3 border-b border-zinc-200 px-4 py-4 dark:border-zinc-800"
    >
      {postId !== undefined && (
        <input type="hidden" name="postId" value={postId} />
      )}
      {threadRootId !== undefined && (
        <input type="hidden" name="threadRootId" value={threadRootId} />
      )}
      {redirectTo && (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      )}
      {media && <input type="hidden" name="imagePath" value={media.path} />}
      <div
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold uppercase text-amber-900 dark:bg-amber-900 dark:text-amber-100"
      >
        {username[0]}
      </div>
      <div className="min-w-0 flex-1">
        <span className="font-semibold">@{username}</span>
        <textarea
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          rows={autoFocus ? 5 : 2}
          autoFocus={autoFocus}
          className="mt-1 w-full resize-none bg-transparent outline-none placeholder:text-zinc-500"
        />

        {media && (
          <div className="relative mt-2 inline-block">
            {/* Local preview of the uploaded file (a blob: URL, so not next/image). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={media.previewUrl}
              alt="Attached image preview"
              className="max-h-64 rounded-xl border border-zinc-200 dark:border-zinc-800"
            />
            <button
              type="button"
              onClick={() => {
                // Not posted yet, so delete the upload rather than orphan it.
                void createClient()
                  .storage.from(MEDIA_BUCKET)
                  .remove([media.path]);
                setMedia(null);
              }}
              aria-label="Remove image"
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
            >
              ✕
            </button>
          </div>
        )}

        {musicOpen && (
          <div className="mt-2 flex gap-2">
            <input
              type="url"
              value={musicLink}
              onChange={(e) => setMusicLink(e.target.value)}
              onKeyDown={(e) => {
                // Enter adds the link instead of submitting the post.
                if (e.key === "Enter") {
                  e.preventDefault();
                  addMusic();
                }
              }}
              placeholder="Paste a Spotify or Apple Music link"
              aria-label="Spotify or Apple Music link"
              autoFocus
              className="min-w-0 flex-1 rounded-xl border border-zinc-300 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700"
            />
            <button
              type="button"
              onClick={addMusic}
              className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm font-semibold dark:border-zinc-700"
            >
              Add
            </button>
          </div>
        )}

        {(state.error || uploadError || musicError) && (
          <p role="alert" className="text-sm text-red-600">
            {musicError ?? uploadError ?? state.error}
          </p>
        )}

        <div className="mt-2 flex items-center gap-3">
          {mediaUserId && (
            <>
              <input
                ref={fileInput}
                type="file"
                accept={Object.keys(MEDIA_TYPES).join(",")}
                onChange={onPickFile}
                hidden
              />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading || !!media}
                aria-label="Add a picture or GIF"
                className="text-zinc-500 hover:text-zinc-900 disabled:opacity-50 dark:hover:text-white"
              >
                <ImageIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setMusicOpen((o) => !o);
                  setMusicError(null);
                }}
                aria-label="Add music"
                aria-expanded={musicOpen}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              >
                <MusicIcon className="h-5 w-5" />
              </button>
              {uploading && (
                <span className="text-sm text-zinc-500">Uploading…</span>
              )}
            </>
          )}
          <span
            className={`ml-auto text-sm ${tooLong ? "text-red-600" : "text-zinc-500"}`}
          >
            {length}/{MAX_LENGTH}
          </span>
          <button
            type="submit"
            disabled={pending || uploading || empty || tooLong}
            className="rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
          >
            {pending ? `${submitLabel}…` : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
