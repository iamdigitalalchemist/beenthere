import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { getEventByJoinToken } from "@/server/data";
import { EventEndedScreen } from "@/components/event-ended-screen";

type JoinPageProps = { params: Promise<{ token: string }> };

export default async function JoinPage({ params }: JoinPageProps) {
  const { token } = await params;
  const event = await getEventByJoinToken(token);

  if (!event) notFound();

  if (event.status === "ended" || event.status === "expired") {
    return <EventEndedScreen name={event.name} />;
  }

  if (event.status === "draft") {
    return (
      <main
        className="flex min-h-screen items-center justify-center px-6"
        style={{ background: "linear-gradient(180deg, #090918 0%, #10122C 40%, #0C0D20 100%)" }}
      >
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{ background: "radial-gradient(circle at 50% 0%, rgba(117,84,255,.15) 0%, transparent 60%)" }}
        />
        <section
          className="relative z-10 max-w-md rounded-3xl p-8 text-center"
          style={{
            background: "rgba(255,255,255,.04)",
            border: "1px solid rgba(255,255,255,.08)",
            backdropFilter: "blur(18px)",
            boxShadow: "0 8px 32px rgba(0,0,0,.32)",
          }}
        >
          <Image alt="beenThere" className="mx-auto mb-6 brightness-0 invert opacity-80" height={24} src="/logo.webp" width={96} />
          <h1
            className="text-2xl font-bold"
            style={{ color: "rgba(255,255,255,.92)", letterSpacing: "-0.02em" }}
          >
            {event.name}
          </h1>
          <p className="mt-3" style={{ color: "rgba(255,255,255,.45)" }}>
            This event isn&apos;t live yet. Check back once the host has opened the gallery.
          </p>
        </section>
      </main>
    );
  }

  redirect(`/e/${event.publicId}`);
}
