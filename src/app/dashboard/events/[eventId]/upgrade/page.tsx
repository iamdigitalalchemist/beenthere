import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { UpgradeCheckout } from "@/components/dashboard/upgrade-checkout";
import { canManageEvent, requireUser } from "@/server/auth";
import { getRevenueCatEnv } from "@/server/billing";
import { getEventByPublicId } from "@/server/data";

type UpgradePageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function UpgradePage({ params }: UpgradePageProps) {
  const user = await requireUser();
  const { eventId } = await params;
  const event = await getEventByPublicId(eventId);

  if (!event || !canManageEvent(user, event.ownerUserId)) {
    notFound();
  }

  if (event.status === "active") {
    redirect(`/dashboard/events/${event.publicId}`);
  }

  const billingEnv = getRevenueCatEnv();

  return (
    <main className="min-h-screen bg-canvas px-6 py-10 text-ink">
      <section className="mx-auto max-w-lg">
        <Link
          className="text-sm font-semibold text-accent"
          href={`/dashboard/events/${event.publicId}`}
        >
          Back to {event.name}
        </Link>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Take your event live
        </h1>
        <p className="mt-3 text-lg text-ink-muted">
          Pick a plan to unlock the join QR, guest uploads, and the live
          gallery for <span className="font-semibold">{event.name}</span>.
        </p>

        <div className="mt-8 rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-border">
          <UpgradeCheckout
            appUserId={user.id}
            eventPublicId={event.publicId}
            publicApiKey={billingEnv.publicWebApiKey}
            userEmail={user.email}
          />
        </div>
      </section>
    </main>
  );
}
