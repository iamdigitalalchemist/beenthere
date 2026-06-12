import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { requireHostUser } from "@/server/auth";

export default async function DashboardPage() {
  const user = await requireHostUser();

  return (
    <main className="min-h-screen bg-canvas px-6 py-10 text-ink">
      <section className="mx-auto max-w-5xl">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-accent">
            Host dashboard
          </p>
          <div className="flex items-center gap-3 text-sm text-ink-muted">
            <span>{user.email}</span>
            <SignOutButton />
          </div>
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Your events
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-muted">
          Run your event gallery, moderate photos, and share the join link.
        </p>

        <div className="mt-8 rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-border">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Friends & Family Test</h2>
              <p className="mt-1 text-sm text-ink-muted">
                Demo event seeded in the local `beenthere` schema.
              </p>
            </div>
            <Link
              className="rounded-full bg-ink px-5 py-3 text-center text-sm font-bold text-surface transition hover:bg-ink/90"
              href="/dashboard/events/demo-event"
            >
              Open dashboard
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
