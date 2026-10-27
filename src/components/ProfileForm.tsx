"use client";

import Link from "next/link";
import { useActionState } from "react";

import { updateProfile, type ProfileState } from "@/app/profile/actions";

const inputClass =
  "w-full rounded-xl border border-zinc-300 bg-transparent px-4 py-3 outline-none focus:border-zinc-500 dark:border-zinc-700";

type Props = {
  username: string;
  displayName: string;
  bio: string;
  instagram: string;
};

export default function ProfileForm({
  username,
  displayName,
  bio,
  instagram,
}: Props) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateProfile,
    { error: null, values: { displayName, bio, instagram } },
  );

  return (
    <form
      // Remount after each attempt so defaultValue refills the fields.
      key={JSON.stringify(state)}
      action={formAction}
      className="flex flex-col gap-3"
    >
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Name
        <input
          name="displayName"
          defaultValue={state.values?.displayName}
          placeholder={username}
          maxLength={50}
          className={`${inputClass} font-normal`}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Bio
        <textarea
          name="bio"
          defaultValue={state.values?.bio}
          placeholder="A little about you"
          maxLength={160}
          rows={3}
          className={`${inputClass} resize-none font-normal`}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Instagram
        <input
          name="instagram"
          defaultValue={state.values?.instagram}
          placeholder="@yourusername"
          maxLength={60}
          autoCapitalize="none"
          autoCorrect="off"
          className={`${inputClass} font-normal`}
        />
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div className="mt-2 flex gap-3">
        <Link
          href={`/u/${username}`}
          className="flex-1 rounded-xl border border-zinc-300 px-4 py-3 text-center font-semibold dark:border-zinc-700"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-xl bg-zinc-900 px-4 py-3 font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
