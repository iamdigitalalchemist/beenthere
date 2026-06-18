import Image from "next/image";
import Link from "next/link";
import { HeroGrid } from "@/components/hero-grid";
import { SiteNav } from "@/components/site-nav";
import { getAuthenticatedUser } from "@/server/auth";

const DEMO_EVENTS = [
  { id: "wedding", name: "Wedding", cover: "https://images.unsplash.com/photo-1519741497674-611481863552?w=500&q=80" },
  { id: "birthday", name: "Birthday Party", cover: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&q=80" },
  { id: "corporate", name: "Company Retreat", cover: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=500&q=80" },
  { id: "festival", name: "Music Festival", cover: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500&q=80" },
];

const FEATURES = [
  {
    icon: (
      <svg fill="none" height="22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24" width="22">
        <rect height="18" rx="3" ry="3" width="18" x="3" y="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
    title: "Instant gallery",
    body: "Guests scan a QR code and every photo from the event appears in one place — no app, no login.",
  },
  {
    icon: (
      <svg fill="none" height="22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24" width="22">
        <rect height="11" rx="1" width="18" x="3" y="11"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    title: "PIN protection",
    body: "Lock your gallery with a PIN. Only guests with the code can browse or upload.",
  },
  {
    icon: (
      <svg fill="none" height="22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24" width="22">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: "Smart moderation",
    body: "Hosts approve, hide or remove photos before they go live. Full control, always.",
  },
  {
    icon: (
      <svg fill="none" height="22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24" width="22">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
      </svg>
    ),
    title: "Export originals",
    body: "Download every original in one ZIP. Full resolution, no compression.",
  },
  {
    icon: (
      <svg fill="none" height="22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24" width="22">
        <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect height="8" width="12" x="6" y="14"/>
      </svg>
    ),
    title: "Print-ready signage",
    body: "Generate a printable QR poster for your event table in one click.",
  },
  {
    icon: (
      <svg fill="none" height="22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24" width="22">
        <line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/>
      </svg>
    ),
    title: "Live dashboard",
    body: "See uploads, guest count, and storage in real time as your event unfolds.",
  },
];

export default async function Home() {
  const user = await getAuthenticatedUser();

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: "linear-gradient(180deg, #090918 0%, #10122C 40%, #0C0D20 100%)",
      }}
    >
      {/* Atmospheric radial glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: "radial-gradient(circle at 50% 0%, rgba(117,84,255,.18) 0%, transparent 60%)",
        }}
      />

      {/* ── Nav ── */}
      <SiteNav user={user} />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ minHeight: "640px" }}>
        <HeroGrid />

        {/* Deep dark overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, rgba(9,9,24,0.72) 0%, rgba(9,9,24,0.60) 40%, rgba(9,9,24,0.90) 100%)",
          }}
        />
        {/* Centre radial darkening behind text */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(9,9,24,0.50) 0%, transparent 100%)",
          }}
        />

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center justify-center px-6 pb-20 pt-24 text-center sm:pb-24 sm:pt-32 lg:py-52 lg:px-8">
          {/* Mobile logo */}
          <Image
            alt="beenThere"
            className="mb-8 lg:hidden"
            height={44}
            src="/icon-white.webp"
            width={44}
          />

          {/* Eyebrow pill */}
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide"
            style={{
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.10)",
              backdropFilter: "blur(12px)",
              color: "rgba(255,255,255,.70)",
              letterSpacing: "0.06em",
            }}
          >
            <span
              className="inline-block size-1.5 rounded-full"
              style={{ background: "linear-gradient(135deg, #FF6AA9, #B65DFF)" }}
            />
            EVENT PHOTO SHARING
          </div>

          <h1
            className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[72px]"
            style={{ letterSpacing: "-0.02em", color: "rgba(255,255,255,.92)" }}
          >
            Share moments.<br />
            <span
              style={{
                background: "linear-gradient(135deg, #FF6AA9 0%, #B65DFF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Any event.
            </span>
          </h1>

          <p
            className="mt-5 max-w-[280px] text-[14px] leading-relaxed sm:max-w-md sm:text-base lg:text-lg"
            style={{ color: "rgba(255,255,255,.55)", textShadow: "0 1px 8px rgba(0,0,0,.5)" }}
          >
            Collect and share photos from your events in one beautiful private gallery. No app download, no group chat.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              className="whitespace-nowrap rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition active:scale-95 hover:brightness-110"
              href={user ? "/dashboard/new" : "/login"}
              style={{
                background: "linear-gradient(135deg, #FF6DAE, #B35DFF)",
                boxShadow: "0 12px 40px rgba(205,95,255,.30)",
              }}
            >
              {user ? "Create an event" : "Get started free"}
            </Link>
            <Link
              className="whitespace-nowrap rounded-full px-6 py-3 text-sm font-semibold transition active:scale-95"
              href="/join/demo-join-token"
              style={{
                background: "rgba(255,255,255,.06)",
                border: "1px solid rgba(255,255,255,.10)",
                backdropFilter: "blur(12px)",
                color: "rgba(255,255,255,.80)",
              }}
            >
              Try demo &gt;
            </Link>
          </div>
        </div>

        <div className="hero-sentinel" />
      </section>

      {/* ── Any event ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-24">
        <div className="mb-8">
          <h2
            className="text-2xl font-bold lg:text-3xl"
            style={{ letterSpacing: "-0.02em", color: "rgba(255,255,255,.92)" }}
          >
            Any event.
          </h2>
          <p className="mt-2 text-sm lg:text-base" style={{ color: "rgba(255,255,255,.45)" }}>
            Weddings, birthdays, festivals, retreats — one gallery for every occasion.
          </p>
        </div>

        {/* Mobile horizontal scroll */}
        <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] lg:hidden">
          {DEMO_EVENTS.map((event) => (
            <Link
              className="group relative shrink-0 w-44 overflow-hidden"
              href="/join/demo-join-token"
              key={event.id}
              style={{ borderRadius: "24px" }}
            >
              <div className="aspect-[3/4] w-full overflow-hidden" style={{ borderRadius: "24px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" className="size-full object-cover transition duration-300 group-hover:scale-105" src={event.cover} />
              </div>
              <div className="absolute inset-0" style={{ background: "linear-gradient(transparent 40%, rgba(0,0,0,.70) 100%)", borderRadius: "24px" }} />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-[13px] font-bold leading-tight" style={{ color: "rgba(255,255,255,.92)" }}>{event.name}</p>
              </div>
            </Link>
          ))}
          <Link
            className="group shrink-0 w-44 overflow-hidden transition"
            href="/login"
            style={{
              borderRadius: "24px",
              background: "rgba(255,255,255,.04)",
              border: "1px solid rgba(255,255,255,.08)",
            }}
          >
            <div className="aspect-[3/4] w-full flex flex-col items-center justify-center gap-3 px-4 text-center">
              <div
                className="flex size-12 items-center justify-center rounded-full text-white text-2xl font-light transition group-hover:brightness-110"
                style={{ background: "linear-gradient(135deg, #FF6DAE, #B35DFF)", boxShadow: "0 0 24px rgba(214,108,255,.28)" }}
              >+</div>
              <p className="text-[13px] font-semibold" style={{ color: "rgba(255,255,255,.45)" }}>Create yours</p>
            </div>
          </Link>
        </div>

        {/* Desktop grid */}
        <div className="hidden gap-4 lg:grid lg:grid-cols-5">
          {DEMO_EVENTS.map((event) => (
            <Link
              className="group relative overflow-hidden"
              href="/join/demo-join-token"
              key={event.id}
              style={{ borderRadius: "24px" }}
            >
              <div className="aspect-[3/4] w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" className="size-full object-cover transition duration-500 group-hover:scale-105" src={event.cover} />
              </div>
              <div className="absolute inset-0" style={{ background: "linear-gradient(transparent 40%, rgba(0,0,0,.72) 100%)" }} />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-sm font-bold leading-tight" style={{ color: "rgba(255,255,255,.92)" }}>{event.name}</p>
              </div>
            </Link>
          ))}
          <Link
            className="group relative overflow-hidden transition"
            href="/login"
            style={{
              borderRadius: "24px",
              background: "rgba(255,255,255,.04)",
              border: "1px solid rgba(255,255,255,.08)",
            }}
          >
            <div className="aspect-[3/4] w-full flex flex-col items-center justify-center gap-4 px-5 text-center">
              <div
                className="flex size-14 items-center justify-center rounded-full text-white text-3xl font-light transition group-hover:brightness-110"
                style={{ background: "linear-gradient(135deg, #FF6DAE, #B35DFF)", boxShadow: "0 0 24px rgba(214,108,255,.28)" }}
              >+</div>
              <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,.45)" }}>Create yours</p>
            </div>
          </Link>
        </div>
      </section>

      {/* ── Features ── */}
      <section
        className="relative z-10 py-16 lg:py-24"
        id="features"
        style={{ borderTop: "1px solid rgba(255,255,255,.06)" }}
      >
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2
              className="text-2xl font-bold lg:text-3xl"
              style={{ letterSpacing: "-0.02em", color: "rgba(255,255,255,.92)" }}
            >
              Everything you need
            </h2>
            <p className="mt-3 text-sm lg:text-base" style={{ color: "rgba(255,255,255,.45)" }}>
              Built for hosts who care about the details.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon, title, body }) => (
              <div
                className="rounded-3xl p-6 transition hover:-translate-y-0.5"
                key={title}
                style={{
                  background: "rgba(255,255,255,.03)",
                  border: "1px solid rgba(255,255,255,.08)",
                  backdropFilter: "blur(18px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,.32)",
                }}
              >
                <div
                  className="mb-4 flex size-11 items-center justify-center rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,.06)",
                    border: "1px solid rgba(255,255,255,.08)",
                    color: "rgba(255,255,255,.70)",
                  }}
                >
                  {icon}
                </div>
                <h3 className="font-semibold" style={{ color: "rgba(255,255,255,.92)", letterSpacing: "-0.01em" }}>
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,.45)" }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        className="relative z-10 mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-24"
      >
        <div className="mb-12 text-center">
          <h2
            className="text-2xl font-bold lg:text-3xl"
            style={{ letterSpacing: "-0.02em", color: "rgba(255,255,255,.92)" }}
          >
            Up and running in minutes
          </h2>
          <p className="mt-3 text-sm lg:text-base" style={{ color: "rgba(255,255,255,.45)" }}>
            Three steps. No tech skills required.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { step: "01", title: "Create your event", body: "Sign in, name your event, set an optional PIN, and get a shareable join link instantly." },
            { step: "02", title: "Share the QR code", body: "Print our signage template or share the link. Guests tap once to join the gallery." },
            { step: "03", title: "Watch it fill up", body: "Photos appear in real time. Moderate, curate, and export full-res originals when you're done." },
          ].map(({ step, title, body }) => (
            <div
              className="relative rounded-3xl p-7"
              key={step}
              style={{
                background: "rgba(255,255,255,.03)",
                border: "1px solid rgba(255,255,255,.08)",
                backdropFilter: "blur(18px)",
                boxShadow: "0 8px 32px rgba(0,0,0,.32)",
              }}
            >
              <p
                className="text-5xl font-bold"
                style={{
                  background: "linear-gradient(135deg, rgba(255,106,169,.25), rgba(182,93,255,.25))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {step}
              </p>
              <h3 className="mt-3 font-semibold" style={{ color: "rgba(255,255,255,.92)", letterSpacing: "-0.01em" }}>
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,.45)" }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section
        className="relative z-10 mx-auto max-w-6xl px-6 pb-16 lg:px-8 lg:pb-24"
        id="pricing"
      >
        <div className="mb-10 text-center">
          <h2
            className="text-2xl font-bold lg:text-3xl"
            style={{ letterSpacing: "-0.02em", color: "rgba(255,255,255,.92)" }}
          >
            Simple pricing
          </h2>
          <p className="mt-3 text-sm lg:text-base" style={{ color: "rgba(255,255,255,.45)" }}>
            Start free. Upgrade when you need more.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Free */}
          <div
            className="flex flex-col rounded-3xl p-7"
            style={{
              background: "rgba(255,255,255,.03)",
              border: "1px solid rgba(255,255,255,.08)",
              backdropFilter: "blur(18px)",
            }}
          >
            <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,.45)" }}>Free</p>
            <p className="mt-3 text-4xl font-bold" style={{ color: "rgba(255,255,255,.92)", letterSpacing: "-0.02em" }}>$0</p>
            <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,.30)" }}>forever</p>
            <ul className="mt-6 flex flex-col gap-3 text-sm flex-1" style={{ color: "rgba(255,255,255,.55)" }}>
              {["Create & schedule events", "QR code sharing", "PIN-protected gallery"].map(f => (
                <li className="flex items-center gap-2" key={f}>
                  <span
                    className="shrink-0 font-bold"
                    style={{
                      background: "linear-gradient(135deg, #FF6AA9, #B65DFF)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >✓</span> {f}
                </li>
              ))}
            </ul>
            <Link
              className="mt-8 block rounded-full py-2.5 text-center text-sm font-semibold transition hover:brightness-110 active:scale-95"
              href="/login"
              style={{
                background: "rgba(255,255,255,.06)",
                border: "1px solid rgba(255,255,255,.10)",
                color: "rgba(255,255,255,.70)",
              }}
            >
              Get started
            </Link>
          </div>

          {/* Pro — highlighted */}
          <div
            className="relative flex flex-col rounded-3xl p-7"
            style={{
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.10)",
              backdropFilter: "blur(18px)",
              boxShadow: "0 0 40px rgba(165,112,255,.15), 0 8px 32px rgba(0,0,0,.32)",
            }}
          >
            <div
              className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-[11px] font-bold text-white shadow"
              style={{ background: "linear-gradient(135deg, #FF6DAE, #B35DFF)" }}
            >
              Most popular
            </div>
            <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,.45)" }}>Pro</p>
            <p className="mt-3 text-4xl font-bold" style={{ color: "rgba(255,255,255,.92)", letterSpacing: "-0.02em" }}>$50</p>
            <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,.30)" }}>per month</p>
            <ul className="mt-6 flex flex-col gap-3 text-sm flex-1" style={{ color: "rgba(255,255,255,.55)" }}>
              {[
                "Everything in Free",
                "5.0 GB photo storage",
                "1 month storage retention",
                "Export full-res ZIP",
                "Print-ready QR signage",
                "Smart moderation tools",
                "Live dashboard",
                "Social media sharing",
              ].map(f => (
                <li className="flex items-center gap-2" key={f}>
                  <span
                    className="shrink-0 font-bold"
                    style={{
                      background: "linear-gradient(135deg, #FF6AA9, #B65DFF)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >✓</span> {f}
                </li>
              ))}
            </ul>
            <Link
              className="mt-8 block rounded-full py-2.5 text-center text-sm font-semibold text-white transition hover:brightness-110 active:scale-95"
              href="/login"
              style={{
                background: "linear-gradient(135deg, #FF6DAE, #B35DFF)",
                boxShadow: "0 12px 40px rgba(205,95,255,.25)",
              }}
            >
              Get started
            </Link>
          </div>

          {/* Business */}
          <div
            className="flex flex-col rounded-3xl p-7"
            style={{
              background: "rgba(255,255,255,.03)",
              border: "1px solid rgba(255,255,255,.08)",
              backdropFilter: "blur(18px)",
            }}
          >
            <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,.45)" }}>Business</p>
            <p className="mt-3 text-4xl font-bold" style={{ color: "rgba(255,255,255,.92)", letterSpacing: "-0.02em" }}>$200</p>
            <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,.30)" }}>per month</p>
            <ul className="mt-6 flex flex-col gap-3 text-sm flex-1" style={{ color: "rgba(255,255,255,.55)" }}>
              {[
                "Everything in Pro",
                "Unlimited photos",
                "Bulk export & downloads",
                "Team collaboration",
                "Priority support",
              ].map(f => (
                <li className="flex items-center gap-2" key={f}>
                  <span
                    className="shrink-0 font-bold"
                    style={{
                      background: "linear-gradient(135deg, #FF6AA9, #B65DFF)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >✓</span> {f}
                </li>
              ))}
            </ul>
            <Link
              className="mt-8 block rounded-full py-2.5 text-center text-sm font-semibold transition hover:brightness-110 active:scale-95"
              href="/login"
              style={{
                background: "rgba(255,255,255,.06)",
                border: "1px solid rgba(255,255,255,.10)",
                color: "rgba(255,255,255,.70)",
              }}
            >
              Get started
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section
        className="relative z-10 py-20 lg:py-32"
        style={{ borderTop: "1px solid rgba(255,255,255,.06)" }}
      >
        {/* Glow behind CTA */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(117,84,255,.10) 0%, transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-2xl px-6 text-center">
          <h2
            className="text-3xl font-bold lg:text-4xl"
            style={{ letterSpacing: "-0.02em", color: "rgba(255,255,255,.92)" }}
          >
            Ready to create your event?
          </h2>
          <p className="mt-4 text-base" style={{ color: "rgba(255,255,255,.45)" }}>
            Set up a gallery in minutes. Share the link. Watch the photos roll in.
          </p>
          <Link
            className="mt-8 inline-block rounded-full px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-95"
            href="/login"
            style={{
              background: "linear-gradient(135deg, #FF6DAE, #B35DFF)",
              boxShadow: "0 12px 40px rgba(205,95,255,.30)",
            }}
          >
            Create an event for free
          </Link>
        </div>
      </section>

      {/* ── Footer (desktop) ── */}
      <footer
        className="hidden px-8 py-8 lg:block"
        style={{ borderTop: "1px solid rgba(255,255,255,.06)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Image alt="beenThere" className="brightness-0 invert opacity-70" height={28} src="/logo.webp" width={110} />
          <p className="text-xs" style={{ color: "rgba(255,255,255,.30)" }}>© 2026 beenThere. All rights reserved.</p>
          <div className="flex gap-5 text-xs" style={{ color: "rgba(255,255,255,.30)" }}>
            <Link className="transition hover:text-white/70" href="#">Privacy</Link>
            <Link className="transition hover:text-white/70" href="#">Terms</Link>
            <Link className="transition hover:text-white/70" href="#">Contact</Link>
          </div>
        </div>
      </footer>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="fixed bottom-4 left-4 right-4 z-20 lg:hidden"
        style={{
          background: "rgba(15,16,35,.80)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,.08)",
          borderRadius: "28px",
          boxShadow: "0 8px 32px rgba(0,0,0,.40)",
        }}
      >
        <div className="flex items-center justify-around px-2 py-3">
          {[
            { icon: (
              <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24" width="20"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            ), label: "Home", active: true, href: "/" },
            { icon: (
              <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24" width="20"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
            ), label: "Explore", href: "/join/demo-join-token" },
            { cta: true, href: user ? "/dashboard/new" : "/login" },
            { icon: (
              <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24" width="20"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            ), label: "Saved", href: "/login" },
            { icon: (
              <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24" width="20"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            ), label: "Profile", href: "/dashboard" },
          ].map((tab, i) =>
            tab.cta ? (
              <Link
                className="flex size-11 items-center justify-center rounded-full text-white transition hover:brightness-110 active:scale-95"
                href={tab.href!}
                key="cta"
                style={{
                  background: "linear-gradient(135deg, #FF6DAE, #B35DFF)",
                  boxShadow: "0 0 20px rgba(214,108,255,.30)",
                }}
              >
                <svg fill="none" height="20" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20">
                  <line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/>
                </svg>
              </Link>
            ) : (
              <Link className="flex flex-col items-center gap-1" href={tab.href!} key={i}>
                <span style={{ color: tab.active ? "rgba(255,255,255,.92)" : "rgba(255,255,255,.35)" }}>
                  {tab.icon}
                </span>
                <span
                  className="text-[10px] font-medium"
                  style={{ color: tab.active ? "rgba(255,255,255,.70)" : "rgba(255,255,255,.30)" }}
                >
                  {tab.label}
                </span>
              </Link>
            )
          )}
        </div>
      </nav>

      {/* Spacer for mobile bottom nav */}
      <div className="h-24 lg:hidden" />
    </div>
  );
}
