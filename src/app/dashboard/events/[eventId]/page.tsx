import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivateEventBanner } from "@/components/dashboard/activate-event-banner";
import { EventPinSettings } from "@/components/dashboard/event-pin-settings";
import { EventSocialsSettings } from "@/components/dashboard/event-socials-settings";
import { ModerationGrid } from "@/components/dashboard/moderation-grid";
import { SmartAlbums } from "@/components/dashboard/smart-albums";
import { getJoinPath } from "@/lib/join";
import { canManageEvent, requireUser } from "@/server/auth";
import { getDashboardEvent } from "@/server/data";

type Props = {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ tab?: string; view?: string }>;
};

function formatBytes(bytes: number) {
  const gb = bytes / 1024 / 1024 / 1024;
  return `${gb.toFixed(1)} GB`;
}

const statusStyles: Record<string, { pill: string; label: string }> = {
  draft:   { pill: "bg-amber-100 text-amber-700",     label: "Draft" },
  active:  { pill: "bg-emerald-100 text-emerald-700", label: "Live" },
  ended:   { pill: "bg-black/5 text-ink-muted",       label: "Ended" },
  expired: { pill: "bg-black/5 text-ink-muted",       label: "Expired" },
};

export default async function DashboardEventPage({ params, searchParams }: Props) {
  const user = await requireUser();
  const { eventId } = await params;
  const { tab = "overview", view = "all" } = await searchParams;
  const dashboard = await getDashboardEvent(eventId);

  if (!dashboard || !canManageEvent(user, dashboard.event.ownerUserId)) {
    notFound();
  }

  const joinPath = getJoinPath(dashboard.event.joinToken || undefined);
  const storagePercent = Math.min(
    100,
    Math.round((dashboard.event.storageUsedBytes / dashboard.event.storageLimitBytes) * 100),
  );
  const s = statusStyles[dashboard.event.status] ?? statusStyles.draft;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "photos",   label: `Photos${dashboard.stats.totalPhotos > 0 ? ` · ${dashboard.stats.totalPhotos}` : ""}` },
    { id: "settings", label: "Settings" },
  ];

  const base = `/dashboard/events/${dashboard.event.publicId}`;

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-ink">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-20 border-b border-black/5 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link href="/">
            <Image alt="beenThere" height={26} src="/logo.webp" width={104} />
          </Link>
          <Link className="text-sm font-medium text-ink-muted transition hover:text-ink" href="/dashboard">
            ← All events
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-20 pt-8">

        {/* ── Event header ── */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{dashboard.event.name}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${s.pill}`}>{s.label}</span>
            </div>
            <p className="mt-1 text-sm capitalize text-ink-muted">
              {dashboard.event.template} · {new Date(dashboard.event.startsAt).toLocaleDateString()}
            </p>
          </div>

          {/* Quick action buttons */}
          <div className="flex flex-wrap gap-2 sm:shrink-0">
            <Link
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-ink shadow-sm transition hover:border-accent/40 hover:text-accent active:scale-95"
              href={joinPath}
              target="_blank"
            >
              Guest link ↗
            </Link>
            <Link
              className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink/80 active:scale-95"
              href={`/e/${dashboard.event.publicId}`}
              target="_blank"
            >
              Open gallery →
            </Link>
          </div>
        </div>

        {/* Draft banner */}
        {dashboard.event.status === "draft" && (
          <div className="mb-6">
            <ActivateEventBanner eventPublicId={dashboard.event.publicId} />
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="mb-7 flex gap-1 rounded-2xl bg-black/5 p-1 sm:w-fit">
          {tabs.map((t) => (
            <Link
              className={`rounded-xl px-5 py-2 text-sm font-semibold transition active:scale-95 ${
                tab === t.id
                  ? "bg-white text-ink shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
              href={`${base}?tab=${t.id}`}
              key={t.id}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* ══ OVERVIEW TAB ══ */}
        {tab === "overview" && (
          <div className="flex flex-col gap-4">

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: "Photos",     value: dashboard.stats.totalPhotos },
                { label: "Guests",     value: dashboard.stats.guestCount },
                { label: "Reported",   value: dashboard.stats.reportedPhotos,  alert: dashboard.stats.reportedPhotos > 0 },
                { label: "Processing", value: dashboard.stats.processingPhotos },
              ].map(({ label, value, alert }) => (
                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5" key={label}>
                  <p className="text-xs text-ink-muted">{label}</p>
                  <p className={`mt-2 text-3xl font-bold ${alert ? "text-red-500" : ""}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Storage + Share row */}
            <div className="grid gap-4 md:grid-cols-2">

              {/* Storage */}
              <div className="rounded-3xl bg-ink p-6 text-white shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Storage</p>
                <p className="mt-3 text-4xl font-bold">{storagePercent}%</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all ${storagePercent > 85 ? "bg-red-400" : "bg-accent"}`}
                    style={{ width: `${storagePercent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-white/40">
                  {formatBytes(dashboard.event.storageUsedBytes)} of {formatBytes(dashboard.event.storageLimitBytes)}
                </p>
              </div>

              {/* Share */}
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Share with guests</p>
                <p className="mt-3 break-all rounded-2xl bg-[#f8f9fb] px-4 py-3 font-mono text-xs text-ink-muted ring-1 ring-black/5">
                  {joinPath}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    className="rounded-full border border-black/10 bg-[#f8f9fb] px-4 py-2 text-sm font-semibold text-ink transition hover:border-accent/30 hover:text-accent active:scale-95"
                    href={`${base}/signage`}
                  >
                    Printable QR
                  </Link>
                  <a
                    className="rounded-full border border-black/10 bg-[#f8f9fb] px-4 py-2 text-sm font-semibold text-ink transition hover:border-accent/30 hover:text-accent active:scale-95"
                    download
                    href={`/api/events/${dashboard.event.publicId}/export`}
                  >
                    Download ZIP
                  </a>
                  <Link
                    className="rounded-full border border-black/10 bg-[#f8f9fb] px-4 py-2 text-sm font-semibold text-ink transition hover:border-accent/30 hover:text-accent active:scale-95"
                    href={`/e/${dashboard.event.publicId}/slideshow`}
                    target="_blank"
                  >
                    Slideshow ↗
                  </Link>
                </div>
              </div>
            </div>

            {/* Reported photos callout */}
            {dashboard.stats.reportedPhotos > 0 && (
              <div className="flex items-center justify-between gap-4 rounded-3xl bg-red-50 px-6 py-4 ring-1 ring-red-200">
                <div>
                  <p className="font-semibold text-red-800">
                    {dashboard.stats.reportedPhotos} reported photo{dashboard.stats.reportedPhotos > 1 ? "s" : ""} need review
                  </p>
                  <p className="mt-0.5 text-sm text-red-700">Review and approve or remove them before the slideshow.</p>
                </div>
                <Link
                  className="shrink-0 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 active:scale-95"
                  href={`${base}?tab=photos`}
                >
                  Review
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ══ PHOTOS TAB ══ */}
        {tab === "photos" && (
          <div>
            {/* All / Albums sub-toggle */}
            <div className="mb-6 flex gap-1 rounded-2xl bg-black/5 p-1 w-fit">
              {[
                { id: "all", label: "All photos" },
                { id: "albums", label: `Albums${(dashboard.albums.length + dashboard.customAlbums.length) > 0 ? ` · ${dashboard.albums.length + dashboard.customAlbums.length}` : ""}` },
              ].map((v) => (
                <Link
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-95 ${
                    view === v.id
                      ? "bg-white text-ink shadow-sm"
                      : "text-ink-muted hover:text-ink"
                  }`}
                  href={`${base}?tab=photos&view=${v.id}`}
                  key={v.id}
                >
                  {v.label}
                </Link>
              ))}
            </div>

            {view === "albums" ? (
              <SmartAlbums
                albums={dashboard.albums}
                customAlbums={dashboard.customAlbums}
                allPhotos={dashboard.photos}
                uploaderNames={dashboard.uploaderNames}
                reports={dashboard.reports}
                eventPublicId={dashboard.event.publicId}
              />
            ) : (
              <ModerationGrid
                initialPhotos={dashboard.photos}
                reports={dashboard.reports}
                uploaderNames={dashboard.uploaderNames}
                customAlbums={dashboard.customAlbums}
                eventPublicId={dashboard.event.publicId}
              />
            )}
          </div>
        )}

        {/* ══ SETTINGS TAB ══ */}
        {tab === "settings" && (
          <div className="flex flex-col gap-4 max-w-lg">
            <EventPinSettings
              eventPublicId={dashboard.event.publicId}
              pinEnabled={dashboard.event.pinEnabled}
            />

            <EventSocialsSettings
              collectSocials={dashboard.event.collectSocials}
              eventPublicId={dashboard.event.publicId}
            />

            {/* Signage */}
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">QR Signage</p>
              <p className="mt-2 text-sm text-ink-muted">Print a poster for your event so guests can scan and join instantly.</p>
              <Link
                className="mt-4 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/80 active:scale-95"
                href={`${base}/signage`}
              >
                Open signage →
              </Link>
            </div>

            {/* Export */}
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Export</p>
              <p className="mt-2 text-sm text-ink-muted">Download all original photos as a ZIP file.</p>
              <a
                className="mt-4 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/80 active:scale-95"
                download
                href={`/api/events/${dashboard.event.publicId}/export`}
              >
                Download all photos
              </a>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
