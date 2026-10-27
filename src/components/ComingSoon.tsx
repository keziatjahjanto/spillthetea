// Placeholder for tabs that are planned but not built yet.
export default function ComingSoon({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-12 text-center">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="mt-2 text-zinc-500">{message}</p>
    </main>
  );
}
