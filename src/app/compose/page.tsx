import { redirect } from "next/navigation";

import { createPost } from "@/app/posts/actions";
import Composer from "@/components/Composer";
import { getCurrentUser } from "@/lib/auth";

export default async function ComposePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-xl flex-1">
      <h1 className="border-b border-zinc-200 px-4 py-3 font-semibold dark:border-zinc-800">
        New post
      </h1>
      <Composer
        username={user.username}
        action={createPost}
        placeholder="What's the tea?"
        submitLabel="Post"
        mediaUserId={user.id}
        redirectTo="/"
        autoFocus
      />
    </main>
  );
}
