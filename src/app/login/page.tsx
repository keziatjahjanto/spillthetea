import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { signIn } from "@/app/auth/actions";
import AuthForm from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Log in · Spill The Tea" };

export default async function Page() {
  if (await getCurrentUser()) redirect("/");
  return <AuthForm mode="login" action={signIn} />;
}
