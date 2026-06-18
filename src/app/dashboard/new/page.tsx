import Image from "next/image";
import Link from "next/link";
import { CreateEventForm } from "@/components/dashboard/create-event-form";
import { requireUser } from "@/server/auth";

export default async function NewEventPage() {
  await requireUser();

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(180deg, #090918 0%, #10122C 40%, #0C0D20 100%)" }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "radial-gradient(circle at 50% 0%, rgba(117,84,255,.12) 0%, transparent 60%)" }}
      />

      {/* Nav */}
      <header
        className="relative z-10"
        style={{ background: "rgba(9,9,24,.80)", borderBottom: "1px solid rgba(255,255,255,.06)", backdropFilter: "blur(20px)" }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
          <Link href="/">
            <Image alt="beenThere" className="brightness-0 invert opacity-90" height={24} src="/logo.webp" width={96} />
          </Link>
          <Link
            className="text-sm font-medium transition"
            href="/dashboard"
            style={{ color: "rgba(255,255,255,.45)" }}
          >
            Back to events
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-lg px-6 py-12">
        <p
          className="text-xs font-semibold uppercase"
          style={{
            background: "linear-gradient(135deg, #FF6AA9, #B65DFF)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "0.08em",
          }}
        >
          New event
        </p>
        <h1
          className="mt-2 text-3xl font-bold"
          style={{ color: "rgba(255,255,255,.92)", letterSpacing: "-0.02em" }}
        >
          Create an event
        </h1>
        <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,.45)" }}>
          Set up your private gallery. Guests join with a QR code — no app, no accounts.
        </p>

        <div
          className="mt-8 rounded-3xl p-6"
          style={{
            background: "rgba(255,255,255,.04)",
            border: "1px solid rgba(255,255,255,.08)",
            backdropFilter: "blur(18px)",
            boxShadow: "0 8px 32px rgba(0,0,0,.32)",
          }}
        >
          <CreateEventForm />
        </div>
      </main>
    </div>
  );
}
