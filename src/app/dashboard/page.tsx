import Image from "next/image";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { isHostUser, requireUser } from "@/server/auth";
import { getEventsByOwner } from "@/server/data";

const statusStyles: Record<string, { pill: string; label: string }> = {
  draft:   { pill: "bg-amber-100 text-amber-700",     label: "Draft" },
  active:  { pill: "bg-emerald-100 text-emerald-700", label: "Live" },
  ended:   { pill: "bg-black/5 text-ink-muted",       label: "Ended" },
  expired: { pill: "bg-black/5 text-ink-muted",       label: "Expired" },
};

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["Create & schedule events", "QR code sharing", "PIN-protected gallery"],
    cta: null,
    highlighted: false,
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
    highlighted: false,
  },
];

type Props = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const user = await requireUser();
  const events = await getEventsByOwner(user.id);
  const showDemoEvent = isHostUser(user);
  const { tab = "events" } = await searchParams;

  const tabs = [
    { id: "events",  label: "Events" },
    { id: "billing", label: "Billing" },
    { id: "account", label: "Account" },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-ink">

      {/* ── Top nav ── */}
      <header className="sticky top-0 z-20 border-b border-black/5 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link href="/">
            <Image alt="beenThere" height={26} src="/logo.webp" width={104} />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-ink-muted sm:block">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-20 pt-8">

        {/* ── Page title ── */}
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Host dashboard</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight lg:text-3xl">Dashboard</h1>
        </div>

        {/* ── Tab bar ── */}
        <div className="mb-8 flex gap-1 rounded-2xl bg-black/5 p-1 sm:w-fit">
          {tabs.map((t) => (
            <Link
              className={`rounded-xl px-5 py-2 text-sm font-semibold transition active:scale-95 ${
                tab === t.id
                  ? "bg-white text-ink shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
              href={`/dashboard?tab=${t.id}`}
              key={t.id}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* ══ EVENTS TAB ══ */}
        {tab === "events" && (
          <div>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Your events</h2>
                <p className="mt-0.5 text-sm text-ink-muted">Manage galleries, moderate photos, share join links.</p>
              </div>
              <Link
                className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ink/80 active:scale-95"
                href="/dashboard/new"
              >
                + New event
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              {events.map((event) => {
                const s = statusStyles[event.status] ?? statusStyles.draft;
                return (
                  <Link
                    className="group flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:shadow-md hover:ring-accent/20 sm:flex-row sm:items-center sm:justify-between"
                    href={`/dashboard/events/${event.publicId}`}
                    key={event.id}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#f8f9fb] ring-1 ring-black/5">
                        <svg className="size-5 text-ink-muted" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{event.name}</p>
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${s.pill}`}>
                            {s.label}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs capitalize text-ink-muted">
                          {event.template} · {new Date(event.startsAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-ink-muted transition group-hover:text-accent">
                      Open →
                    </span>
                  </Link>
                );
              })}

              {showDemoEvent && (
                <Link
                  className="group flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:shadow-md hover:ring-accent/20 sm:flex-row sm:items-center sm:justify-between"
                  href="/dashboard/events/demo-event"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent-soft ring-1 ring-accent/10">
                      <svg className="size-5 text-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">Friends &amp; Family Test</p>
                        <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-bold text-accent">Demo</span>
                      </div>
                      <p className="mt-0.5 text-xs text-ink-muted">Seeded demo event</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-ink-muted transition group-hover:text-accent">
                    Open →
                  </span>
                </Link>
              )}

              {events.length === 0 && !showDemoEvent && (
                <div className="rounded-3xl border-2 border-dashed border-black/10 bg-white p-14 text-center">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent-soft">
                    <svg className="size-7 text-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="mt-4 font-semibold">No events yet</p>
                  <p className="mt-1.5 text-sm text-ink-muted">Create your first event to get a private gallery and QR join link.</p>
                  <Link
                    className="mt-6 inline-block rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/80 active:scale-95"
                    href="/dashboard/new"
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
              <h2 className="text-lg font-bold">Billing &amp; plans</h2>
              <p className="mt-0.5 text-sm text-ink-muted">Choose the plan that fits your events.</p>
            </div>

            {/* Current plan banner */}
            <div className="mb-6 flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent-soft">
                <svg className="size-5 text-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Current plan: <span className="text-accent">Free</span></p>
                <p className="text-sm text-ink-muted">Upgrade to unlock storage, exports and more.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {PLANS.map((plan) => (
                <div
                  className={`flex flex-col rounded-3xl p-6 ${
                    plan.highlighted
                      ? "bg-ink text-white shadow-xl ring-1 ring-black/10"
                      : "bg-white shadow-sm ring-1 ring-black/5"
                  }`}
                  key={plan.id}
                >
                  {plan.highlighted && (
                    <span className="mb-3 w-fit rounded-full bg-accent px-3 py-0.5 text-[11px] font-bold text-white">
                      Most popular
                    </span>
                  )}
                  <p className={`text-sm font-semibold ${plan.highlighted ? "text-white/50" : "text-ink-muted"}`}>
                    {plan.name}
                  </p>
                  <div className="mt-2 flex items-end gap-1">
                    <p className={`text-4xl font-bold ${plan.highlighted ? "text-white" : "text-ink"}`}>
                      {plan.price}
                    </p>
                    <p className={`mb-1 text-sm ${plan.highlighted ? "text-white/40" : "text-ink-muted"}`}>
                      {plan.period}
                    </p>
                  </div>
                  <ul className={`mt-5 flex flex-col gap-2.5 flex-1 text-sm ${plan.highlighted ? "text-white/70" : "text-ink-muted"}`}>
                    {plan.features.map((f) => (
                      <li className="flex items-start gap-2" key={f}>
                        <span className="mt-0.5 shrink-0 text-accent font-bold">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  {plan.cta ? (
                    <Link
                      className={`mt-7 block rounded-full py-2.5 text-center text-sm font-semibold transition active:scale-95 ${
                        plan.highlighted
                          ? "bg-accent text-white hover:bg-accent-hover"
                          : "border border-black/10 bg-black/5 text-ink hover:bg-black/10"
                      }`}
                      href="/login"
                    >
                      {plan.cta}
                    </Link>
                  ) : (
                    <div className={`mt-7 block rounded-full py-2.5 text-center text-sm font-semibold ${plan.highlighted ? "text-white/30" : "text-ink-muted"}`}>
                      Current plan
                    </div>
                  )}
                </div>
              ))}
            </div>

            <p className="mt-5 text-center text-xs text-ink-muted">
              Payments powered by RevenueCat. Cancel anytime.
            </p>
          </div>
        )}

        {/* ══ ACCOUNT TAB ══ */}
        {tab === "account" && (
          <div>
            <div className="mb-5">
              <h2 className="text-lg font-bold">Account</h2>
              <p className="mt-0.5 text-sm text-ink-muted">Your profile and preferences.</p>
            </div>

            <div className="flex flex-col gap-4">

              {/* Profile card */}
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Profile</p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-ink text-lg font-bold text-white">
                    {user.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{user.email}</p>
                    <p className="mt-0.5 text-sm text-ink-muted">Signed in with Google</p>
                  </div>
                </div>
              </div>

              {/* Plan card */}
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Plan</p>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Free</p>
                    <p className="mt-0.5 text-sm text-ink-muted">Basic access — no payment on file</p>
                  </div>
                  <Link
                    className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-hover active:scale-95"
                    href="/dashboard?tab=billing"
                  >
                    Upgrade
                  </Link>
                </div>
              </div>

              {/* Danger zone */}
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Session</p>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Sign out</p>
                    <p className="mt-0.5 text-sm text-ink-muted">You can sign back in with Google anytime.</p>
                  </div>
                  <SignOutButton />
                </div>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
