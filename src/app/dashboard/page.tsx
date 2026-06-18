import Image from "next/image";
import Link from "next/link";
import { SlidingTabBar } from "@/components/sliding-tab-bar";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { isHostUser, requireUser } from "@/server/auth";
import { getEventsByOwner } from "@/server/data";

const statusStyles: Record<string, { pill: string; pillStyle: React.CSSProperties; label: string }> = {
  draft:   { pill: "", pillStyle: { background: "rgba(255,190,85,.12)", color: "#FFBE55", border: "1px solid rgba(255,190,85,.20)" }, label: "Draft" },
  active:  { pill: "", pillStyle: { background: "rgba(86,216,146,.12)", color: "#56D892", border: "1px solid rgba(86,216,146,.20)" }, label: "Live" },
  ended:   { pill: "", pillStyle: { background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.35)", border: "1px solid rgba(255,255,255,.08)" }, label: "Ended" },
  expired: { pill: "", pillStyle: { background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.35)", border: "1px solid rgba(255,255,255,.08)" }, label: "Expired" },
};

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["Create & schedule events", "QR code sharing", "PIN-protected gallery"],
    cta: null,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$50",
    period: "/ month",
    features: ["Everything in Free", "5.0 GB photo storage", "1 month storage retention", "Export full-res ZIP", "Print-ready QR signage", "Smart moderation", "Live dashboard", "Social media sharing"],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    id: "business",
    name: "Business",
    price: "$200",
    period: "/ month",
    features: ["Everything in Pro", "Unlimited photos", "Bulk export & downloads", "Team collaboration", "Priority support"],
    cta: "Upgrade to Business",
  },
];

type Props = { searchParams: Promise<{ tab?: string }> };

export default async function DashboardPage({ searchParams }: Props) {
  const user = await requireUser();
  const events = await getEventsByOwner(user.id);
  const showDemoEvent = isHostUser(user);
  const { tab = "events" } = await searchParams;

  const tabs = [
    { id: "events", label: "Events" },
    { id: "billing", label: "Billing" },
    { id: "account", label: "Account" },
  ];

  const glass = {
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(255,255,255,.08)",
    backdropFilter: "blur(18px)",
    boxShadow: "0 8px 32px rgba(0,0,0,.32)",
  } satisfies React.CSSProperties;

  const glassElevated = {
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.10)",
    backdropFilter: "blur(18px)",
    boxShadow: "0 0 40px rgba(165,112,255,.12), 0 8px 32px rgba(0,0,0,.32)",
  } satisfies React.CSSProperties;

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(180deg, #090918 0%, #10122C 40%, #0C0D20 100%)" }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "radial-gradient(circle at 50% 0%, rgba(117,84,255,.12) 0%, transparent 60%)" }}
      />

      {/* Top nav */}
      <header
        className="sticky top-0 z-20"
        style={{ background: "rgba(9,9,24,.80)", borderBottom: "1px solid rgba(255,255,255,.06)", backdropFilter: "blur(20px)" }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <Link href="/">
            <Image alt="beenThere" className="brightness-0 invert opacity-90" height={24} src="/logo.webp" width={96} />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm sm:block" style={{ color: "rgba(255,255,255,.35)" }}>{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-5 pb-20 pt-8">

        {/* Page title */}
        <div className="mb-7">
          <p
            className="text-xs font-semibold uppercase"
            style={{
              background: "linear-gradient(135deg, #FF6AA9, #B65DFF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "0.08em",
            }}
          >
            Host dashboard
          </p>
          <h1
            className="mt-1.5 text-2xl font-bold lg:text-3xl"
            style={{ color: "rgba(255,255,255,.92)", letterSpacing: "-0.02em" }}
          >
            Dashboard
          </h1>
        </div>

        {/* Tab bar */}
        <SlidingTabBar
          activeId={tab}
          className="mb-8 w-fit"
          tabs={tabs.map((t) => ({ id: t.id, label: t.label, href: `/dashboard?tab=${t.id}` }))}
        />

        {/* ══ EVENTS TAB ══ */}
        {tab === "events" && (
          <div>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold" style={{ color: "rgba(255,255,255,.92)" }}>Your events</h2>
                <p className="mt-0.5 text-sm" style={{ color: "rgba(255,255,255,.40)" }}>
                  Manage galleries, moderate photos, share join links.
                </p>
              </div>
              <Link
                className="shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-95"
                href="/dashboard/new"
                style={{
                  background: "linear-gradient(135deg, #FF6DAE, #B35DFF)",
                  boxShadow: "0 8px 24px rgba(205,95,255,.25)",
                }}
              >
                + New event
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              {events.map((event) => {
                const s = statusStyles[event.status] ?? statusStyles.draft;
                return (
                  <Link
                    className="event-card group flex rounded-3xl p-5 transition"
                    href={`/dashboard/events/${event.publicId}`}
                    key={event.id}
                    style={{ ...glass, transition: "box-shadow 200ms, border-color 200ms" }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="flex size-11 shrink-0 items-center justify-center rounded-2xl"
                        style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)" }}
                      >
                        <svg fill="none" height="20" stroke="rgba(255,255,255,.50)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="20">
                          <path d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                          <path d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold" style={{ color: "rgba(255,255,255,.92)" }}>{event.name}</p>
                          <span
                            className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                            style={s.pillStyle}
                          >
                            {s.label}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs capitalize" style={{ color: "rgba(255,255,255,.35)" }}>
                          {event.template} · {new Date(event.startsAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className="event-card-open shrink-0 text-sm font-semibold transition"
                      style={{ color: "rgba(255,255,255,.30)" }}
                    >
                      Open
                    </span>
                  </Link>
                );
              })}

              {showDemoEvent && (
                <Link
                  className="event-card group flex rounded-3xl p-5 transition"
                  href="/dashboard/events/demo-event"
                  style={glass}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex size-11 shrink-0 items-center justify-center rounded-2xl"
                      style={{ background: "rgba(224,182,255,.08)", border: "1px solid rgba(224,182,255,.15)" }}
                    >
                      <svg fill="none" height="20" stroke="#e0b6ff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="20">
                        <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold" style={{ color: "rgba(255,255,255,.92)" }}>Friends &amp; Family Test</p>
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                          style={{ background: "rgba(224,182,255,.10)", color: "#e0b6ff", border: "1px solid rgba(224,182,255,.15)" }}
                        >
                          Demo
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs" style={{ color: "rgba(255,255,255,.35)" }}>Seeded demo event</p>
                    </div>
                  </div>
                  <span className="event-card-open shrink-0 text-sm font-semibold" style={{ color: "rgba(255,255,255,.30)" }}>Open</span>
                </Link>
              )}

              {events.length === 0 && !showDemoEvent && (
                <div
                  className="rounded-3xl p-14 text-center"
                  style={{ border: "1px dashed rgba(255,255,255,.10)", background: "rgba(255,255,255,.02)" }}
                >
                  <div
                    className="mx-auto flex size-14 items-center justify-center rounded-full"
                    style={{ background: "rgba(224,182,255,.08)", border: "1px solid rgba(224,182,255,.15)" }}
                  >
                    <svg fill="none" height="24" stroke="#e0b6ff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24">
                      <path d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                      <path d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                    </svg>
                  </div>
                  <p className="mt-4 font-semibold" style={{ color: "rgba(255,255,255,.92)" }}>No events yet</p>
                  <p className="mt-1.5 text-sm" style={{ color: "rgba(255,255,255,.40)" }}>
                    Create your first event to get a private gallery and QR join link.
                  </p>
                  <Link
                    className="mt-6 inline-block rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95"
                    href="/dashboard/new"
                    style={{ background: "linear-gradient(135deg, #FF6DAE, #B35DFF)", boxShadow: "0 8px 24px rgba(205,95,255,.25)" }}
                  >
                    Create your first event
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ BILLING TAB ══ */}
        {tab === "billing" && (
          <div>
            <div className="mb-5">
              <h2 className="text-lg font-bold" style={{ color: "rgba(255,255,255,.92)" }}>Billing &amp; plans</h2>
              <p className="mt-0.5 text-sm" style={{ color: "rgba(255,255,255,.40)" }}>Choose the plan that fits your events.</p>
            </div>

            {/* Current plan banner */}
            <div className="mb-6 flex items-center gap-4 rounded-3xl p-5" style={glass}>
              <div
                className="flex size-11 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: "rgba(86,216,146,.10)", border: "1px solid rgba(86,216,146,.15)" }}
              >
                <svg fill="none" height="20" stroke="#56D892" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="20">
                  <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold" style={{ color: "rgba(255,255,255,.92)" }}>
                  Current plan: <span style={{
                    background: "linear-gradient(135deg, #FF6AA9, #B65DFF)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}>Free</span>
                </p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,.40)" }}>Upgrade to unlock storage, exports and more.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {PLANS.map((plan) => (
                <div
                  className="flex flex-col rounded-3xl p-6 relative"
                  key={plan.id}
                  style={plan.highlighted ? glassElevated : glass}
                >
                  {plan.highlighted && (
                    <span
                      className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-[11px] font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #FF6DAE, #B35DFF)" }}
                    >
                      Most popular
                    </span>
                  )}
                  <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,.40)" }}>{plan.name}</p>
                  <div className="mt-2 flex items-end gap-1">
                    <p className="text-4xl font-bold" style={{ color: "rgba(255,255,255,.92)", letterSpacing: "-0.02em" }}>{plan.price}</p>
                    <p className="mb-1 text-sm" style={{ color: "rgba(255,255,255,.30)" }}>{plan.period}</p>
                  </div>
                  <ul className="mt-5 flex flex-col gap-2.5 flex-1 text-sm" style={{ color: "rgba(255,255,255,.50)" }}>
                    {plan.features.map((f) => (
                      <li className="flex items-start gap-2" key={f}>
                        <span className="mt-0.5 shrink-0 font-bold" style={{
                          background: "linear-gradient(135deg, #FF6AA9, #B65DFF)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  {plan.cta ? (
                    <Link
                      className="mt-7 block rounded-full py-2.5 text-center text-sm font-semibold text-white transition hover:brightness-110 active:scale-95"
                      href="/login"
                      style={{ background: "linear-gradient(135deg, #FF6DAE, #B35DFF)", boxShadow: "0 8px 24px rgba(205,95,255,.20)" }}
                    >
                      {plan.cta}
                    </Link>
                  ) : (
                    <div className="mt-7 rounded-full py-2.5 text-center text-sm font-semibold" style={{ color: "rgba(255,255,255,.20)" }}>
                      Current plan
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-5 text-center text-xs" style={{ color: "rgba(255,255,255,.25)" }}>
              Payments powered by RevenueCat. Cancel anytime.
            </p>
          </div>
        )}

        {/* ══ ACCOUNT TAB ══ */}
        {tab === "account" && (
          <div>
            <div className="mb-5">
              <h2 className="text-lg font-bold" style={{ color: "rgba(255,255,255,.92)" }}>Account</h2>
              <p className="mt-0.5 text-sm" style={{ color: "rgba(255,255,255,.40)" }}>Your profile and preferences.</p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="rounded-3xl p-6" style={glass}>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,.30)", letterSpacing: "0.08em" }}>Profile</p>
                <div className="mt-4 flex items-center gap-4">
                  <div
                    className="flex size-12 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #FF6DAE, #B35DFF)", boxShadow: "0 0 20px rgba(214,108,255,.25)" }}
                  >
                    {user.email[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold" style={{ color: "rgba(255,255,255,.92)" }}>{user.email}</p>
                    <p className="mt-0.5 text-sm" style={{ color: "rgba(255,255,255,.35)" }}>Signed in with Google</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl p-6" style={glass}>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,.30)", letterSpacing: "0.08em" }}>Plan</p>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold" style={{ color: "rgba(255,255,255,.92)" }}>Free</p>
                    <p className="mt-0.5 text-sm" style={{ color: "rgba(255,255,255,.35)" }}>Basic access — no payment on file</p>
                  </div>
                  <Link
                    className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95"
                    href="/dashboard?tab=billing"
                    style={{ background: "linear-gradient(135deg, #FF6DAE, #B35DFF)" }}
                  >
                    Upgrade
                  </Link>
                </div>
              </div>

              <div className="rounded-3xl p-6" style={glass}>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,.30)", letterSpacing: "0.08em" }}>Session</p>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold" style={{ color: "rgba(255,255,255,.92)" }}>Sign out</p>
                    <p className="mt-0.5 text-sm" style={{ color: "rgba(255,255,255,.35)" }}>Sign back in with Google anytime.</p>
                  </div>
                  <div className="shrink-0">
                    <SignOutButton />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
