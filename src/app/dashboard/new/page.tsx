import Image from "next/image";
import Link from "next/link";
import { CreateEventForm } from "@/components/dashboard/create-event-form";
import { requireUser } from "@/server/auth";

export default async function NewEventPage() {
  await requireUser();

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-ink">

      {/* ── Top nav ── */}
      <header className="border-b border-black/5 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href="/">
            <Image alt="beenThere" height={28} src="/logo.webp" width={110} />
          </Link>
          <Link className="text-sm font-medium text-ink-muted transition hover:text-ink" href="/dashboard">
            ← Back to events
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">New event</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Create an event</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Set up your private gallery. Guests join with a QR code — no app, no accounts.
        </p>

        <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <CreateEventForm />
        </div>
      </main>
    </div>
  );
}
