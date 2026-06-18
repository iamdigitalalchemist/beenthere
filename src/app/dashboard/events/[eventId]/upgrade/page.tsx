import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { UpgradeCheckout } from "@/components/dashboard/upgrade-checkout";
import { canManageEvent, requireUser } from "@/server/auth";
import { getRevenueCatEnv } from "@/server/billing";
import { getEventByPublicId } from "@/server/data";

type UpgradePageProps = { params: Promise<{ eventId: string }> };

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
    <main
      className="min-h-screen px-6 py-10"
      style={{ background: "linear-gradient(180deg, #090918 0%, #10122C 40%, #0C0D20 100%)" }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "radial-gradient(circle at 50% 0%, rgba(117,84,255,.12) 0%, transparent 60%)" }}
      />

      <section className="relative z-10 mx-auto max-w-lg">
        <Link
          className="text-sm font-semibold transition"
          href={`/dashboard/events/${event.publicId}`}
          style={{
            background: "linear-gradient(135deg, #FF6AA9, #B65DFF)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          ← Back to {event.name}
        </Link>
        <h1
          className="mt-3 text-4xl font-semibold"
          style={{ color: "rgba(255,255,255,.92)", letterSpacing: "-0.02em" }}
        >
          Take your event live
        </h1>
        <p className="mt-3 text-lg" style={{ color: "rgba(255,255,255,.45)" }}>
          Pick a plan to unlock the join QR, guest uploads, and the live gallery for{" "}
          <span style={{ color: "rgba(255,255,255,.80)", fontWeight: 600 }}>{event.name}</span>.
        </p>

        <div
          className="mt-8 rounded-3xl p-6"
          style={{
            background: "rgba(255,255,255,.04)",
            border: "1px solid rgba(255,255,255,.08)",
            backdropFilter: "blur(18px)",
            boxShadow: "0 8px 32px rgba(0,0,0,.32)",
          }}
        >
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
