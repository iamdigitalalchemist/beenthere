import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintSignageButton } from "@/components/dashboard/print-signage-button";
import { getAppOrigin } from "@/lib/app-url";
import { getJoinPath, getJoinUrl } from "@/lib/join";
import { canManageEvent, requireUser } from "@/server/auth";
import { getDashboardEvent } from "@/server/data";
import { createJoinQrDataUrl } from "@/server/qr";

type SignagePageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

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
    <main className="print-signage-root min-h-screen bg-canvas px-6 py-8 text-ink">
      <section className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="no-print flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            className="text-sm font-semibold text-accent"
            href={`/dashboard/events/${dashboard.event.publicId}`}
          >
            Back to event dashboard
          </Link>
          <PrintSignageButton />
        </div>

        <article className="print-signage-card mx-auto w-full max-w-xl rounded-[2rem] bg-surface p-10 shadow-soft ring-1 ring-border">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-accent">
            BeenThere
          </p>
          <h1 className="mt-4 text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            {dashboard.event.name}
          </h1>
          <p className="mt-3 text-center text-lg text-ink-muted">
            Scan to see everyone&apos;s photos
          </p>

          <div className="mx-auto mt-8 w-fit rounded-3xl bg-surface p-4 ring-1 ring-border">
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

          <p className="mt-8 text-center text-base text-ink-muted">
            Add yours without joining a group chat or downloading an app.
          </p>
          {dashboard.event.pinEnabled ? (
            <p className="mt-4 text-center text-sm font-semibold text-accent">
              A host PIN is required after scanning.
            </p>
          ) : null}
          <p className="mt-6 break-all text-center font-mono text-xs text-ink-muted">
            {joinUrl}
          </p>
        </article>

        <p className="no-print text-center text-sm text-ink-muted">
          Print this page and place it near the entrance, bar, or photo wall.
          Guests scan {joinPath} to open the gallery instantly.
        </p>
      </section>
    </main>
  );
}
