"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

// `values` echoes back what was typed so the form can refill itself after an
// error (React resets forms once an action finishes). Never includes the password.
export type AuthState = {
  error: string | null;
  values?: { username?: string; email?: string };
};

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!USERNAME_RE.test(username)) {
    return {
      values: { username, email },
      error:
        "Username must be 3–20 characters: lowercase letters, numbers, or _.",
    };
  }
  if (password.length < 6) {
    return {
      values: { username, email },
      error: "Password must be at least 6 characters.",
    };
  }

  const supabase = await createClient();

  const { data: taken } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (taken) {
    return {
      values: { username, email },
      error: `@${username} is already taken.`,
    };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });
  if (error) {
    // The profile trigger fails if the username was grabbed a moment ago.
    if (error.message.toLowerCase().includes("database error")) {
      return {
        values: { username, email },
        error: `@${username} may already be taken. Try another.`,
      };
    }
    return {
      values: { username, email },
      error: error.message,
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { values: { email }, error: "Wrong email or password." };

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
