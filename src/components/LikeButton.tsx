"use client";

import { startTransition, useOptimistic } from "react";

import { toggleLike } from "@/app/posts/actions";
import { HeartIcon } from "@/components/icons";

type Props = { postId: number; liked: boolean; count: number };

// Flips instantly (optimistic), then the server action makes it real.
export default function LikeButton({ postId, liked, count }: Props) {
  const [state, setOptimistic] = useOptimistic(
    { liked, count },
    (current, nextLiked: boolean) => ({
      liked: nextLiked,
      count: current.count + (nextLiked ? 1 : -1),
    }),
  );

  function onClick() {
    const next = !state.liked;
    startTransition(async () => {
      setOptimistic(next);
      await toggleLike(postId, state.liked);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={state.liked}
      aria-label={state.liked ? "Unlike" : "Like"}
      className={`relative z-10 flex items-center gap-1 text-sm ${
        state.liked ? "text-red-600" : "text-zinc-500 hover:text-red-600"
      }`}
    >
      <HeartIcon
        className={`h-5 w-5 ${state.liked ? "fill-current" : ""}`}
      />
      {state.count > 0 && state.count}
    </button>
  );
}
