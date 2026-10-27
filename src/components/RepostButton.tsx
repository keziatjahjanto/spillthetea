"use client";

import { startTransition, useOptimistic } from "react";

import { toggleRepost } from "@/app/posts/actions";
import { RepostIcon } from "@/components/icons";

type Props = { postId: number; reposted: boolean; count: number };

// Flips instantly (optimistic), then the server action makes it real.
export default function RepostButton({ postId, reposted, count }: Props) {
  const [state, setOptimistic] = useOptimistic(
    { reposted, count },
    (current, next: boolean) => ({
      reposted: next,
      count: current.count + (next ? 1 : -1),
    }),
  );

  function onClick() {
    const next = !state.reposted;
    startTransition(async () => {
      setOptimistic(next);
      await toggleRepost(postId, state.reposted);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={state.reposted}
      aria-label={state.reposted ? "Undo repost" : "Repost"}
      className={`relative z-10 flex items-center gap-1 text-sm ${
        state.reposted
          ? "text-emerald-600"
          : "text-zinc-500 hover:text-emerald-600"
      }`}
    >
      <RepostIcon className="h-5 w-5" />
      {state.count > 0 && state.count}
    </button>
  );
}
