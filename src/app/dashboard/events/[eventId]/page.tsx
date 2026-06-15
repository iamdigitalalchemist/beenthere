import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivateEventBanner } from "@/components/dashboard/activate-event-banner";
import { EventPinSettings } from "@/components/dashboard/event-pin-settings";
import { ModerationGrid } from "@/components/dashboard/moderation-grid";
import { getJoinPath } from "@/lib/join";
import { canManageEvent, requireUser } from "@/server/auth";
import { getDashboardEvent } from "@/server/data";

type DashboardEventPageProps = {
  params: Promise<{ eventId: string }>;
};

function formatBytes(bytes: number) {
  const gb = bytes / 1024 / 1024 / 1024;
  return `${gb.toFixed(1)} GB`;
}

export default async function DashboardEventPage({ params }: DashboardEventPageProps) {
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
    <div className="min-h-screen bg-[#f8f9fb] text-ink">

      {/* ── Top nav ── */}
      <header className="border-b border-black/5 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/">
            <Image alt="beenThere" height={28} src="/logo.webp" width={110} />
          </Link>
          <Link className="text-sm font-medium text-ink-muted transition hover:text-ink" href="/dashboard">
            ← All events
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">

        {/* ── Page header ── */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">Event dashboard</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight lg:text-4xl">{dashboard.event.name}</h1>
            <p className="mt-1 text-sm text-ink-muted capitalize">
              {dashboard.event.status === "draft" ? "Draft — not yet live" : dashboard.event.status}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-accent/40 hover:text-accent active:scale-95"
              href={`/dashboard/events/${dashboard.event.publicId}/signage`}
            >
              Printable QR
            </Link>
            <Link
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-accent/40 hover:text-accent active:scale-95"
              href={joinPath}
            >
              Guest join link
            </Link>
            <Link
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-accent/40 hover:text-accent active:scale-95"
              href={`/e/${dashboard.event.publicId}/slideshow`}
            >
              Slideshow
            </Link>
            <Link
              className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink/80 active:scale-95"
              href={`/e/${dashboard.event.publicId}`}
            >
              Open gallery →
            </Link>
          </div>
        </div>

        {dashboard.event.status === "draft" && (
          <div className="mt-6">
            <ActivateEventBanner eventPublicId={dashboard.event.publicId} />
          </div>
        )}

        {/* ── Stats ── */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Total photos", value: dashboard.stats.totalPhotos },
            { label: "Guests uploading", value: dashboard.stats.guestCount },
            { label: "Reported", value: dashboard.stats.reportedPhotos, alert: dashboard.stats.reportedPhotos > 0 },
            { label: "Processing", value: dashboard.stats.processingPhotos },
          ].map(({ label, value, alert }) => (
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5" key={label}>
              <p className="text-xs text-ink-muted">{label}</p>
              <p className={`mt-2 text-3xl font-bold ${alert ? "text-red-500" : ""}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Storage + Share + PIN ── */}
        <div className="mt-3 grid gap-3 lg:grid-cols-3">

          {/* Storage */}
          <div className="rounded-3xl bg-ink p-6 text-white shadow-sm">
            <p className="text-xs text-white/50">Storage used</p>
            <p className="mt-2 text-4xl font-bold">{storagePercent}%</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-accent" style={{ width: `${storagePercent}%` }} />
            </div>
            <p className="mt-2 text-xs text-white/50">
              {formatBytes(dashboard.event.storageUsedBytes)} of {formatBytes(dashboard.event.storageLimitBytes)}
            </p>
          </div>

          {/* Share */}
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <p className="text-xs font-semibold text-ink-muted">Share link</p>
            <p className="mt-3 break-all rounded-2xl bg-[#f8f9fb] p-3 font-mono text-xs text-ink-muted">
              {joinPath}
            </p>
            <div className="mt-3 flex flex-col gap-1.5">
              <Link
                className="text-sm font-semibold text-accent hover:underline"
                href={`/dashboard/events/${dashboard.event.publicId}/signage`}
              >
                Open printable QR →
              </Link>
              <a
                className="text-sm font-semibold text-accent hover:underline"
                download
                href={`/api/events/${dashboard.event.publicId}/export`}
              >
                Download all photos (.zip) →
              </a>
            </div>
          </div>

          {/* PIN */}
          <EventPinSettings
            eventPublicId={dashboard.event.publicId}
            pinEnabled={dashboard.event.pinEnabled}
          />
        </div>

        {/* ── Photos ── */}
        <div className="mt-3">
          <ModerationGrid
            initialPhotos={dashboard.photos}
            reports={dashboard.reports}
            uploaderNames={dashboard.uploaderNames}
          />
        </div>
      </main>
    </div>
  );
}
