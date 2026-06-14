import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { isHostUser, requireUser } from "@/server/auth";
import { getEventsByOwner } from "@/server/data";

const statusStyles: Record<string, string> = {
  draft: "bg-amber-100 text-amber-800",
  active: "bg-emerald-100 text-emerald-800",
  ended: "bg-border text-ink-muted",
  expired: "bg-border text-ink-muted",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const events = await getEventsByOwner(user.id);
  const showDemoEvent = isHostUser(user);

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
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Your events
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-ink-muted">
              Run your event gallery, moderate photos, and share the join link.
            </p>
          </div>
          <Link
            className="rounded-full bg-ink px-6 py-3 text-center text-sm font-bold text-surface transition hover:bg-ink/90"
            href="/dashboard/new"
          >
            Create event
          </Link>
        </div>

        <div className="mt-8 flex flex-col gap-4">
          {events.map((event) => (
            <div
              className="rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-border"
              key={event.id}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-semibold">{event.name}</h2>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                        statusStyles[event.status] ?? statusStyles.draft
                      }`}
                    >
                      {event.status === "draft" ? "draft — not live" : event.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm capitalize text-ink-muted">
                    {event.template} ·{" "}
                    {new Date(event.startsAt).toLocaleDateString()}
                  </p>
                </div>
                <Link
                  className="rounded-full bg-ink px-5 py-3 text-center text-sm font-bold text-surface transition hover:bg-ink/90"
                  href={`/dashboard/events/${event.publicId}`}
                >
                  Open dashboard
                </Link>
              </div>
            </div>
          ))}

          {events.length === 0 && !showDemoEvent ? (
            <div className="rounded-3xl bg-surface p-8 text-center shadow-sm ring-1 ring-border">
              <p className="text-lg font-semibold">No events yet</p>
              <p className="mt-2 text-sm text-ink-muted">
                Create your first event to get a private gallery and QR join
                link for your guests.
              </p>
            </div>
          ) : null}

          {showDemoEvent ? (
            <div className="rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-border">
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
          ) : null}
        </div>
      </section>
    </main>
  );
}
