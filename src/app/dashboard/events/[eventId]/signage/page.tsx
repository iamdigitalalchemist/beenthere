import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintSignageButton } from "@/components/dashboard/print-signage-button";
import { getAppOrigin } from "@/lib/app-url";
import { getJoinPath, getJoinUrl } from "@/lib/join";
import { canManageEvent, requireUser } from "@/server/auth";
import { getDashboardEvent } from "@/server/data";
import { createJoinQrDataUrl } from "@/server/qr";

type SignagePageProps = { params: Promise<{ eventId: string }> };

export default async function SignagePage({ params }: SignagePageProps) {
  const user = await requireUser();
  const { eventId } = await params;
  const dashboard = await getDashboardEvent(eventId);

  if (!dashboard || !canManageEvent(user, dashboard.event.ownerUserId)) {
    notFound();
  }

  const origin = await getAppOrigin();
  const joinToken = dashboard.event.joinToken || undefined;
  const joinPath = getJoinPath(joinToken);
  const joinUrl = getJoinUrl(origin, joinToken);
  const qrDataUrl = await createJoinQrDataUrl(joinUrl);

  return (
    <div
      className="print-signage-root min-h-screen"
      style={{ background: "linear-gradient(180deg, #090918 0%, #10122C 40%, #0C0D20 100%)" }}
    >
      {/* Ambient glow */}
      <div
        className="no-print pointer-events-none fixed inset-0 z-0"
        style={{ background: "radial-gradient(circle at 50% 0%, rgba(117,84,255,.12) 0%, transparent 60%)" }}
      />

      {/* Nav */}
      <header
        className="no-print relative z-10"
        style={{ background: "rgba(9,9,24,.80)", borderBottom: "1px solid rgba(255,255,255,.06)", backdropFilter: "blur(20px)" }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3.5">
          <Link href="/">
            <Image alt="beenThere" className="brightness-0 invert opacity-90" height={24} src="/logo.webp" width={96} />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              className="text-sm font-medium transition"
              href={`/dashboard/events/${dashboard.event.publicId}`}
              style={{ color: "rgba(255,255,255,.45)" }}
            >
              ← Back to dashboard
            </Link>
            <PrintSignageButton />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-10">
        {/* The printable card — white for print readability */}
        <article className="print-signage-card w-full max-w-xl rounded-3xl bg-white p-10 shadow-2xl">
          <Image alt="beenThere" className="mx-auto mb-2" height={24} src="/logo.webp" width={96} />
          <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {dashboard.event.name}
          </h1>
          <p className="mt-2 text-center text-base text-ink-muted">
            Scan to see everyone&apos;s photos
          </p>

          <div className="mx-auto mt-8 w-fit rounded-3xl bg-[#f8f9fb] p-5 ring-1 ring-black/5">
            <Image
              alt={`QR code to join ${dashboard.event.name}`}
              className="h-64 w-64"
              height={512}
              priority
              src={qrDataUrl}
              unoptimized
              width={512}
            />
          </div>

          <p className="mt-8 text-center text-sm text-ink-muted">
            Add your photos without a group chat or app download.
          </p>
          {dashboard.event.pinEnabled ? (
            <p className="mt-3 text-center text-xs font-semibold text-accent">
              A host PIN is required after scanning.
            </p>
          ) : null}
          <p className="mt-4 break-all text-center font-mono text-xs text-ink-muted/60">
            {joinUrl}
          </p>
        </article>

        <p className="no-print text-center text-sm" style={{ color: "rgba(255,255,255,.35)" }}>
          Print this page and place it near the entrance or photo wall. Guests scan to open the gallery instantly.
        </p>
      </main>
    </div>
  );
}
