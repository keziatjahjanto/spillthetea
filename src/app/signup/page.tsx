import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { signUp } from "@/app/auth/actions";
import AuthForm from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign up · Spill The Tea" };

export default async function Page() {
  if (await getCurrentUser()) redirect("/");
  return <AuthForm mode="signup" action={signUp} />;
}
