import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivateEventBanner } from "@/components/dashboard/activate-event-banner";
import { EventPinSettings } from "@/components/dashboard/event-pin-settings";
import { ModerationGrid } from "@/components/dashboard/moderation-grid";
import { getJoinPath } from "@/lib/join";
import { canManageEvent, requireUser } from "@/server/auth";
import { getDashboardEvent } from "@/server/data";

type DashboardEventPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

function formatBytes(bytes: number) {
  const gigabytes = bytes / 1024 / 1024 / 1024;
  return `${gigabytes.toFixed(1)} GB`;
}

export default async function DashboardEventPage({
  params,
}: DashboardEventPageProps) {
  const user = await requireUser();
  const { eventId } = await params;
  const dashboard = await getDashboardEvent(eventId);

  if (!dashboard || !canManageEvent(user, dashboard.event.ownerUserId)) {
    notFound();
  }

  const joinPath = getJoinPath(dashboard.event.joinToken || undefined);
  const storagePercent = Math.round(
    (dashboard.event.storageUsedBytes / dashboard.event.storageLimitBytes) * 100,
  );

  return (
    <main className="min-h-screen bg-canvas px-6 py-8 text-ink">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              className="text-sm font-semibold text-accent"
              href="/dashboard"
            >
              Back to events
            </Link>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              {dashboard.event.name}
            </h1>
            <p className="mt-3 text-lg text-ink-muted">
              Host controls for your live event gallery.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="rounded-full border border-border bg-surface px-5 py-3 text-center text-sm font-bold text-ink transition hover:border-accent/40"
              href={`/dashboard/events/${dashboard.event.publicId}/signage`}
            >
              Printable QR
            </Link>
            <Link
              className="rounded-full border border-border bg-surface px-5 py-3 text-center text-sm font-bold text-ink transition hover:border-accent/40"
              href={joinPath}
            >
              Guest join link
            </Link>
            <Link
              className="rounded-full border border-border bg-surface px-5 py-3 text-center text-sm font-bold text-ink transition hover:border-accent/40"
              href={`/e/${dashboard.event.publicId}/slideshow`}
            >
              Open slideshow
            </Link>
            <Link
              className="rounded-full bg-ink px-5 py-3 text-center text-sm font-bold text-surface transition hover:bg-ink/90"
              href={`/e/${dashboard.event.publicId}`}
            >
              Open gallery
            </Link>
          </div>
        </div>

        {dashboard.event.status === "draft" ? (
          <ActivateEventBanner eventPublicId={dashboard.event.publicId} />
        ) : null}

        <section className="grid gap-4 md:grid-cols-4">
          <article className="rounded-3xl bg-surface p-5 shadow-sm ring-1 ring-border">
            <p className="text-sm text-ink-muted">Total photos</p>
            <p className="mt-2 text-3xl font-semibold">
              {dashboard.stats.totalPhotos}
            </p>
          </article>
          <article className="rounded-3xl bg-surface p-5 shadow-sm ring-1 ring-border">
            <p className="text-sm text-ink-muted">Guests uploading</p>
            <p className="mt-2 text-3xl font-semibold">
              {dashboard.stats.guestCount}
            </p>
          </article>
          <article className="rounded-3xl bg-surface p-5 shadow-sm ring-1 ring-border">
            <p className="text-sm text-ink-muted">Reported</p>
            <p
              className={`mt-2 text-3xl font-semibold ${
                dashboard.stats.reportedPhotos > 0 ? "text-red-600" : ""
              }`}
            >
              {dashboard.stats.reportedPhotos}
            </p>
          </article>
          <article className="rounded-3xl bg-surface p-5 shadow-sm ring-1 ring-border">
            <p className="text-sm text-ink-muted">Processing</p>
            <p className="mt-2 text-3xl font-semibold">
              {dashboard.stats.processingPhotos}
            </p>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
          <article className="rounded-3xl bg-ink p-6 text-surface shadow-sm">
            <p className="text-sm text-surface/70">Storage used</p>
            <p className="mt-2 text-4xl font-semibold">{storagePercent}%</p>
            <p className="mt-2 text-sm text-surface/70">
              {formatBytes(dashboard.event.storageUsedBytes)} of{" "}
              {formatBytes(dashboard.event.storageLimitBytes)}
            </p>
          </article>
          <article className="rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-border">
            <p className="text-sm font-semibold text-ink-muted">Share link</p>
            <p className="mt-3 break-all rounded-2xl bg-canvas p-4 font-mono text-sm">
              {joinPath}
            </p>
            <Link
              className="mt-3 inline-block text-sm font-semibold text-accent"
              href={`/dashboard/events/${dashboard.event.publicId}/signage`}
            >
              Open printable QR signage
            </Link>
            <a
              className="mt-1 block text-sm font-semibold text-accent"
              download
              href={`/api/events/${dashboard.event.publicId}/export`}
            >
              Download all photos (.zip)
            </a>
          </article>
          <EventPinSettings
            eventPublicId={dashboard.event.publicId}
            pinEnabled={dashboard.event.pinEnabled}
          />
        </section>

        <ModerationGrid
          initialPhotos={dashboard.photos}
          reports={dashboard.reports}
          uploaderNames={dashboard.uploaderNames}
        />
      </section>
    </main>
  );
}
