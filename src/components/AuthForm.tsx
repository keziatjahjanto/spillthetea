"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { AuthState } from "@/app/auth/actions";

type Props = {
  mode: "login" | "signup";
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
};

const inputClass =
  "w-full rounded-xl border border-zinc-300 bg-transparent px-4 py-3 outline-none focus:border-zinc-500 dark:border-zinc-700";

export default function AuthForm({ mode, action }: Props) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const isSignup = mode === "signup";

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-12">
      <h1 className="mb-6 text-2xl font-bold">
        {isSignup ? "Join Spill The Tea" : "Welcome back"}
      </h1>

      <form
        // Remount after each attempt so defaultValue refills the fields.
        key={JSON.stringify(state)}
        action={formAction}
        className="flex flex-col gap-3"
      >
        {isSignup && (
          <input
            name="username"
            defaultValue={state.values?.username}
            placeholder="Username"
            autoComplete="username"
            required
            minLength={3}
            maxLength={20}
            pattern="[a-zA-Z0-9_]+"
            title="Letters, numbers, or _"
            className={inputClass}
          />
        )}
        <input
          name="email"
          type="email"
          defaultValue={state.values?.email}
          placeholder="Email"
          autoComplete="email"
          required
          className={inputClass}
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          required
          minLength={isSignup ? 6 : undefined}
          className={inputClass}
        />

        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-zinc-900 px-4 py-3 font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          {pending ? "…" : isSignup ? "Sign up" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold underline">
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className="font-semibold underline">
              Sign up
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
