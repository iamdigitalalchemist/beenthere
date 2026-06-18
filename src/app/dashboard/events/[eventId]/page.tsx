import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivateEventBanner } from "@/components/dashboard/activate-event-banner";
import { EventPinSettings } from "@/components/dashboard/event-pin-settings";
import { EventSocialsSettings } from "@/components/dashboard/event-socials-settings";
import { UploadPolicySettings } from "@/components/dashboard/upload-policy-settings";
import { ModerationGrid } from "@/components/dashboard/moderation-grid";
import { SmartAlbums } from "@/components/dashboard/smart-albums";
import { PhotosTabHeader } from "@/components/dashboard/photos-tab-header";
import { StorageCard } from "@/components/dashboard/storage-card";
import { SlidingTabBar } from "@/components/sliding-tab-bar";
import { getJoinPath } from "@/lib/join";
import { canManageEvent, requireUser } from "@/server/auth";
import { getDashboardEvent } from "@/server/data";

type Props = {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ tab?: string; view?: string }>;
};


const statusStyles: Record<string, { pillStyle: React.CSSProperties; label: string; pill: string }> = {
  draft:   { pill: "", pillStyle: { background: "rgba(255,190,85,.12)", color: "#FFBE55", border: "1px solid rgba(255,190,85,.20)" }, label: "Draft" },
  active:  { pill: "", pillStyle: { background: "rgba(86,216,146,.12)", color: "#56D892", border: "1px solid rgba(86,216,146,.20)" }, label: "Live" },
  ended:   { pill: "", pillStyle: { background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.35)", border: "1px solid rgba(255,255,255,.08)" }, label: "Ended" },
  expired: { pill: "", pillStyle: { background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.35)", border: "1px solid rgba(255,255,255,.08)" }, label: "Expired" },
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
  const s = statusStyles[dashboard.event.status] ?? statusStyles.draft;

  const tabs = [
    { id: "overview", label: "Overview", icon: null },
    { id: "photos",   label: `Photos${dashboard.stats.totalPhotos > 0 ? ` · ${dashboard.stats.totalPhotos}` : ""}`, icon: null },
    { id: "settings", label: null, icon: (
      <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24" width="16">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ) },
  ];

  const base = `/dashboard/events/${dashboard.event.publicId}`;

  const glass: React.CSSProperties = {
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(255,255,255,.08)",
    backdropFilter: "blur(18px)",
    boxShadow: "0 8px 32px rgba(0,0,0,.32)",
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(180deg, #090918 0%, #10122C 40%, #0C0D20 100%)" }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "radial-gradient(circle at 50% 0%, rgba(117,84,255,.10) 0%, transparent 60%)" }}
      />

      {/* ── Nav ── */}
      <header
        className="sticky top-0 z-20"
        style={{ background: "rgba(9,9,24,.80)", borderBottom: "1px solid rgba(255,255,255,.06)", backdropFilter: "blur(20px)" }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <Link href="/">
            <Image alt="beenThere" className="brightness-0 invert opacity-90" height={24} src="/logo.webp" width={96} />
          </Link>
          <Link
            className="text-sm font-medium transition"
            href="/dashboard"
            style={{ color: "rgba(255,255,255,.45)" }}
          >
            All events
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-5 pb-20 pt-8">

        {/* ── Event header ── */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1
                className="text-2xl font-bold lg:text-3xl"
                style={{ color: "rgba(255,255,255,.92)", letterSpacing: "-0.02em" }}
              >
                {dashboard.event.name}
              </h1>
              <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={s.pillStyle}>{s.label}</span>
            </div>
            <p className="mt-1 text-sm capitalize" style={{ color: "rgba(255,255,255,.40)" }}>
              {dashboard.event.template} · {new Date(dashboard.event.startsAt).toLocaleDateString()}
            </p>
          </div>

          {/* Quick action buttons */}
          <div className="flex flex-wrap gap-2 sm:shrink-0">
            <Link
              className="rounded-full px-4 py-2 text-sm font-medium transition active:scale-95"
              href={joinPath}
              style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)", color: "rgba(255,255,255,.70)" }}
              target="_blank"
            >
              Guest link
            </Link>
            <Link
              className="rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95"
              href={`/e/${dashboard.event.publicId}/slideshow`}
              style={{ background: "linear-gradient(135deg, #FF6DAE, #B35DFF)", boxShadow: "0 4px 16px rgba(205,95,255,.25)" }}
              target="_blank"
            >
              Open gallery
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
        <div className="mb-7 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <SlidingTabBar
            activeId={tab}
            className="w-max sm:w-fit"
            tabs={tabs.map((t) => ({
              id: t.id,
              label: t.icon ? (
                <span className="flex items-center justify-center" style={{ padding: "0 2px" }}>{t.icon}</span>
              ) : t.label,
              href: `${base}?tab=${t.id}`,
            }))}
          />
        </div>

        {/* ══ OVERVIEW TAB ══ */}
        {tab === "overview" && (
          <div className="flex flex-col gap-4">

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: "Photos",     value: dashboard.stats.totalPhotos },
                { label: "Guests",     value: dashboard.stats.guestCount },
                { label: "Reported",   value: dashboard.stats.reportedPhotos, alert: dashboard.stats.reportedPhotos > 0 },
                { label: "Processing", value: dashboard.stats.processingPhotos },
              ].map(({ label, value, alert }) => (
                <div className="rounded-3xl p-5" key={label} style={glass}>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,.35)" }}>{label}</p>
                  <p
                    className="mt-2 text-3xl font-bold"
                    style={{ color: alert ? "#FF5F7B" : "rgba(255,255,255,.92)", letterSpacing: "-0.02em" }}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Storage + Share row */}
            <div className="grid gap-4 md:grid-cols-2">

              {/* Storage */}
              <StorageCard
                eventId={dashboard.event.id}
                initialUsedBytes={dashboard.event.storageUsedBytes}
                limitBytes={dashboard.event.storageLimitBytes}
              />

              {/* Share */}
              <div className="rounded-3xl p-6" style={glass}>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,.30)", letterSpacing: "0.08em" }}>Share with guests</p>
                <p
                  className="mt-3 break-all rounded-2xl px-4 py-3 font-mono text-xs"
                  style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", color: "rgba(255,255,255,.40)" }}
                >
                  {joinPath}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    { label: "Printable QR", href: `${base}/signage`, download: false },
                    { label: "Download ZIP", href: `/api/events/${dashboard.event.publicId}/export`, download: true },
                    { label: "Slideshow", href: `/e/${dashboard.event.publicId}/slideshow`, download: false, target: "_blank" },
                  ].map(({ label, href, download: dl, target }) => (
                    dl ? (
                      <a
                        className="rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95"
                        download
                        href={href}
                        key={label}
                        style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)", color: "rgba(255,255,255,.65)" }}
                      >
                        {label}
                      </a>
                    ) : (
                      <Link
                        className="rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95"
                        href={href}
                        key={label}
                        style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)", color: "rgba(255,255,255,.65)" }}
                        target={target}
                      >
                        {label}
                      </Link>
                    )
                  ))}
                </div>
              </div>
            </div>

            {/* Reported photos callout */}
            {dashboard.stats.reportedPhotos > 0 && (
              <div
                className="flex items-center justify-between gap-4 rounded-3xl px-6 py-4"
                style={{ background: "rgba(255,95,123,.10)", border: "1px solid rgba(255,95,123,.20)" }}
              >
                <div>
                  <p className="font-semibold" style={{ color: "#FF8FA3" }}>
                    {dashboard.stats.reportedPhotos} reported photo{dashboard.stats.reportedPhotos > 1 ? "s" : ""} need review
                  </p>
                  <p className="mt-0.5 text-sm" style={{ color: "rgba(255,143,163,.70)" }}>
                    Review and approve or remove them before the slideshow.
                  </p>
                </div>
                <Link
                  className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95"
                  href={`${base}?tab=photos`}
                  style={{ background: "#FF5F7B" }}
                >
                  Review
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ══ PHOTOS TAB ══ */}
        {tab === "photos" && (
          <PhotosTabHeader
            albums={dashboard.albums}
            allPhotos={dashboard.photos}
            base={base}
            customAlbums={dashboard.customAlbums}
            eventId={dashboard.event.id}
            eventPublicId={dashboard.event.publicId}
            reports={dashboard.reports}
            totalAlbums={dashboard.albums.length + dashboard.customAlbums.length}
            uploaderNames={dashboard.uploaderNames}
            view={view}
          />
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

            <UploadPolicySettings
              eventPublicId={dashboard.event.publicId}
              uploadPolicy={dashboard.event.uploadPolicy}
            />

            {/* Signage */}
            <div className="rounded-3xl p-6" style={glass}>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,.30)", letterSpacing: "0.08em" }}>QR Signage</p>
              <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,.45)" }}>Print a poster for your event so guests can scan and join instantly.</p>
              <Link
                className="mt-4 inline-block rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95"
                href={`${base}/signage`}
                style={{ background: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.12)" }}
              >
                Open signage
              </Link>
            </div>

            {/* Export */}
            <div className="rounded-3xl p-6" style={glass}>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,.30)", letterSpacing: "0.08em" }}>Export</p>
              <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,.45)" }}>Download all original photos as a ZIP file.</p>
              <a
                className="mt-4 inline-block rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95"
                download
                href={`/api/events/${dashboard.event.publicId}/export`}
                style={{ background: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.12)" }}
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
