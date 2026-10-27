"use client";

import { useActionState, useState } from "react";

import { createPost, type PostState } from "@/app/posts/actions";

const MAX_POST_LENGTH = 500;

export default function Composer({ username }: { username: string }) {
  const [state, formAction, pending] = useActionState<PostState, FormData>(
    createPost,
    { error: null },
  );
  const [content, setContent] = useState("");
  const [lastState, setLastState] = useState(state);

  // Clear the textarea once a post goes through.
  if (state !== lastState) {
    setLastState(state);
    if (state.ok) setContent("");
  }

  const length = content.trim().length;
  const tooLong = length > MAX_POST_LENGTH;

  return (
    <form
      action={formAction}
      className="flex gap-3 border-b border-zinc-200 px-4 py-4 dark:border-zinc-800"
    >
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
          placeholder="What's the tea?"
          aria-label="What's the tea?"
          rows={2}
          className="mt-1 w-full resize-none bg-transparent outline-none placeholder:text-zinc-500"
        />

        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}

        <div className="mt-2 flex items-center justify-end gap-3">
          <span
            className={`text-sm ${tooLong ? "text-red-600" : "text-zinc-500"}`}
          >
            {length}/{MAX_POST_LENGTH}
          </span>
          <button
            type="submit"
            disabled={pending || length === 0 || tooLong}
            className="rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
          >
            {pending ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </form>
  );
}
