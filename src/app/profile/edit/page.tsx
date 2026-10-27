import { redirect } from "next/navigation";

import ProfileForm from "@/components/ProfileForm";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function EditProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, bio, instagram")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Edit profile</h1>
      <ProfileForm
        username={user.username}
        displayName={profile?.display_name ?? ""}
        bio={profile?.bio ?? ""}
        instagram={profile?.instagram ?? ""}
      />
    </main>
  );
}
