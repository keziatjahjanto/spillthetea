"use client";

import { startTransition, useOptimistic } from "react";

import { toggleSave } from "@/app/posts/actions";
import { BookmarkIcon } from "@/components/icons";

type Props = { postId: number; saved: boolean };

// Flips instantly (optimistic), then the server action makes it real.
export default function SaveButton({ postId, saved }: Props) {
  const [optimisticSaved, setOptimistic] = useOptimistic(saved);

  function onClick() {
    startTransition(async () => {
      setOptimistic(!optimisticSaved);
      await toggleSave(postId, optimisticSaved);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={optimisticSaved}
      aria-label={optimisticSaved ? "Unsave" : "Save"}
      className={`relative z-10 ${
        optimisticSaved
          ? "text-zinc-900 dark:text-white"
          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
      }`}
    >
      <BookmarkIcon
        className={`h-5 w-5 ${optimisticSaved ? "fill-current" : ""}`}
      />
    </button>
  );
}
