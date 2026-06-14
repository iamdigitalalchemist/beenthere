import { notFound, redirect } from "next/navigation";
import { getEventByJoinToken } from "@/server/data";

type JoinPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function JoinPage({ params }: JoinPageProps) {
  const { token } = await params;
  const event = await getEventByJoinToken(token);

  if (!event) {
    notFound();
  }

  if (event.status === "draft") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas px-6 text-ink">
        <section className="max-w-md rounded-3xl bg-surface p-8 text-center shadow-sm ring-1 ring-border">
          <h1 className="text-2xl font-semibold">{event.name}</h1>
          <p className="mt-3 text-ink-muted">
            This event isn&apos;t live yet. Check back once the host has opened
            the gallery.
          </p>
        </section>
      </main>
    );
  }

  redirect(`/e/${event.publicId}`);
}
