import Link from "next/link";
import { CreateEventForm } from "@/components/dashboard/create-event-form";
import { requireUser } from "@/server/auth";

export default async function NewEventPage() {
  await requireUser();

  return (
    <main className="min-h-screen bg-canvas px-6 py-10 text-ink">
      <section className="mx-auto max-w-lg">
        <Link className="text-sm font-semibold text-accent" href="/dashboard">
          Back to events
        </Link>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Create an event
        </h1>
        <p className="mt-3 text-lg text-ink-muted">
          Set up your private gallery. Guests join with a QR code — no app, no
          accounts.
        </p>

        <div className="mt-8 rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-border">
          <CreateEventForm />
        </div>
      </section>
    </main>
  );
}
