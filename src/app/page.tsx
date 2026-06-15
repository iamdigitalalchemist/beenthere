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
    icon: "📸",
    title: "Instant gallery",
    body: "Guests scan a QR code and every photo from the event appears in one place — no app, no login.",
  },
  {
    icon: "🔒",
    title: "PIN protection",
    body: "Lock your gallery with a PIN. Only guests with the code can browse or upload.",
  },
  {
    icon: "✦",
    title: "Smart moderation",
    body: "Hosts approve, hide or remove photos before they go live. Full control, always.",
  },
  {
    icon: "⬇️",
    title: "Export originals",
    body: "Download every original in one ZIP. Full resolution, no compression.",
  },
  {
    icon: "🖨️",
    title: "Print-ready signage",
    body: "Generate a printable QR poster for your event table in one click.",
  },
  {
    icon: "📊",
    title: "Live dashboard",
    body: "See uploads, guest count, and storage in real time as your event unfolds.",
  },
];

export default async function Home() {
  const user = await getAuthenticatedUser();

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-ink">

      {/* ── Desktop nav (transparent over hero, solid after) ── */}
      <SiteNav user={user} />

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0f1117]" style={{minHeight: "600px"}}>

        {/* Angled parallax masonry grid */}
        <HeroGrid />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f1117]/70 via-[#0f1117]/65 to-[#0f1117]/85" />
        {/* Extra darkening behind text centre */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(15,17,23,0.55)_0%,transparent_100%)]" />

        {/* Hero text */}
        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center justify-center px-6 pb-16 pt-20 text-center sm:pb-20 sm:pt-28 lg:px-8 lg:py-44">

          {/* Mobile icon — shown instead of nav */}
          <Image
            alt="beenThere"
            className="mb-6 lg:hidden"
            height={48}
            src="/icon-white.webp"
            width={48}
          />

          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-7xl">
            Share moments.<br />
            <span className="text-accent">Any event.</span>
          </h1>
          <p className="mt-5 max-w-[260px] text-[14px] leading-relaxed text-white/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.5)] sm:max-w-lg sm:text-[15px] lg:text-lg">
            Collect and share photos from your events in one beautiful private gallery. No app download, no group chat.
          </p>
          <div className="mt-7 flex items-center justify-center gap-2.5">
            <Link
              className="whitespace-nowrap rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-ink shadow-lg transition hover:bg-white/90 active:scale-95 sm:px-6 sm:py-3 sm:text-sm"
              href={user ? "/dashboard/new" : "/login"}
            >
              {user ? "Create an event" : "Get started"}
            </Link>
            <Link
              className="whitespace-nowrap rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-[13px] font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 active:scale-95 sm:px-6 sm:py-3 sm:text-sm"
              href="/join/demo-join-token"
            >
              Try demo →
            </Link>
          </div>
        </div>

        {/* Sentinel — triggers nav style change when hero leaves viewport */}
        <div className="hero-sentinel" />
      </section>

      {/* ── Any event ───────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="mb-6">
          <h2 className="text-2xl font-bold lg:text-3xl">Any event.</h2>
          <p className="mt-2 text-ink-muted">Weddings, birthdays, festivals, retreats — one gallery for every occasion.</p>
        </div>

        {/* Mobile: horizontal scroll */}
        <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] lg:hidden">
          {DEMO_EVENTS.map((event) => (
            <Link
              className="group relative shrink-0 w-44 overflow-hidden rounded-3xl shadow-md"
              href="/join/demo-join-token"
              key={event.id}
            >
              <div className="aspect-[3/4] w-full overflow-hidden bg-accent-soft">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" className="size-full object-cover transition duration-300 group-hover:scale-105" src={event.cover} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-[13px] font-bold leading-tight text-white">{event.name}</p>
              </div>
            </Link>
          ))}
          {/* Yours card */}
          <Link
            className="group shrink-0 w-44 overflow-hidden rounded-3xl border-2 border-dashed border-ink/15 bg-white transition hover:border-accent/40 hover:bg-accent-soft/30"
            href="/login"
          >
            <div className="aspect-[3/4] w-full flex flex-col items-center justify-center gap-3 px-4 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-ink text-white text-2xl font-light shadow-sm transition group-hover:bg-accent">+</div>
              <p className="text-[13px] font-semibold text-ink/60 group-hover:text-accent transition">Create yours</p>
            </div>
          </Link>
        </div>

        {/* Desktop: grid */}
        <div className="hidden gap-4 lg:grid lg:grid-cols-5">
          {DEMO_EVENTS.map((event) => (
            <Link
              className="group relative overflow-hidden rounded-3xl shadow-md"
              href="/join/demo-join-token"
              key={event.id}
            >
              <div className="aspect-[3/4] w-full overflow-hidden bg-accent-soft">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" className="size-full object-cover transition duration-500 group-hover:scale-105" src={event.cover} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-sm font-bold leading-tight text-white">{event.name}</p>
              </div>
            </Link>
          ))}
          {/* Yours card */}
          <Link
            className="group relative overflow-hidden rounded-3xl border-2 border-dashed border-ink/15 bg-white transition hover:border-accent/40 hover:bg-accent-soft/30"
            href="/login"
          >
            <div className="aspect-[3/4] w-full flex flex-col items-center justify-center gap-4 px-5 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-ink text-white text-3xl font-light shadow-sm transition group-hover:bg-accent">+</div>
              <p className="text-sm font-semibold text-ink/50 group-hover:text-accent transition">Create yours</p>
            </div>
          </Link>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section className="bg-white py-16 lg:py-24" id="features">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold lg:text-3xl">Everything you need</h2>
            <p className="mt-3 text-ink-muted">Built for hosts who care about the details.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon, title, body }) => (
              <div
                className="rounded-3xl bg-[#f8f9fb] p-6 ring-1 ring-black/5 transition hover:shadow-soft hover:-translate-y-0.5"
                key={title}
              >
                <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5 text-xl">
                  {icon}
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold lg:text-3xl">Up and running in minutes</h2>
          <p className="mt-3 text-ink-muted">Three steps. No tech skills required.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { step: "01", title: "Create your event", body: "Sign in, name your event, set an optional PIN, and get a shareable join link instantly." },
            { step: "02", title: "Share the QR code", body: "Print our signage template or share the link. Guests tap once to join the gallery." },
            { step: "03", title: "Watch it fill up", body: "Photos appear in real time. Moderate, curate, and export full-res originals when you're done." },
          ].map(({ step, title, body }) => (
            <div className="relative rounded-3xl bg-white p-7 shadow-sm ring-1 ring-black/5" key={step}>
              <p className="text-5xl font-bold text-black/5">{step}</p>
              <h3 className="mt-2 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-16 lg:px-8 lg:pb-24" id="pricing">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold lg:text-3xl">Simple pricing</h2>
          <p className="mt-3 text-ink-muted">Start free. Upgrade when you need more.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Free */}
          <div className="flex flex-col rounded-3xl bg-white p-7 ring-1 ring-black/5 shadow-sm">
            <p className="text-sm font-semibold text-ink-muted">Free</p>
            <p className="mt-3 text-4xl font-bold">$0</p>
            <p className="mt-1 text-xs text-ink-muted">forever</p>
            <ul className="mt-6 flex flex-col gap-3 text-sm text-ink-muted flex-1">
              {[
                "Create & schedule events",
                "QR code sharing",
                "PIN-protected gallery",
              ].map(f => (
                <li className="flex items-center gap-2" key={f}>
                  <span className="text-accent font-bold">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link
              className="mt-8 block rounded-full border border-black/10 bg-[#f8f9fb] py-2.5 text-center text-sm font-semibold text-ink transition hover:bg-black/5 active:scale-95"
              href="/login"
            >
              Get started
            </Link>
          </div>

          {/* Pro — highlighted */}
          <div className="flex flex-col rounded-3xl bg-ink p-7 shadow-xl ring-1 ring-black/10 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-[11px] font-bold text-white shadow">Most popular</div>
            <p className="text-sm font-semibold text-white/50">Pro</p>
            <p className="mt-3 text-4xl font-bold text-white">$50</p>
            <p className="mt-1 text-xs text-white/40">per month</p>
            <ul className="mt-6 flex flex-col gap-3 text-sm text-white/70 flex-1">
              {[
                "Everything in Free",
                "5.0 GB photo storage",
                "1 month of storage retention",
                "Export full-res ZIP",
                "Print-ready QR signage",
                "Smart moderation tools",
                "Live dashboard",
                "Social media sharing",
              ].map(f => (
                <li className="flex items-center gap-2" key={f}>
                  <span className="text-accent font-bold">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link
              className="mt-8 block rounded-full bg-accent py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover active:scale-95"
              href="/login"
            >
              Get started
            </Link>
          </div>

          {/* Business */}
          <div className="flex flex-col rounded-3xl bg-white p-7 ring-1 ring-black/5 shadow-sm">
            <p className="text-sm font-semibold text-ink-muted">Business</p>
            <p className="mt-3 text-4xl font-bold">$200</p>
            <p className="mt-1 text-xs text-ink-muted">per month</p>
            <ul className="mt-6 flex flex-col gap-3 text-sm text-ink-muted flex-1">
              {[
                "Everything in Pro",
                "Unlimited photos",
                "Bulk export & downloads",
                "Team collaboration",
                "Priority support",
              ].map(f => (
                <li className="flex items-center gap-2" key={f}>
                  <span className="text-accent font-bold">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link
              className="mt-8 block rounded-full border border-black/10 bg-[#f8f9fb] py-2.5 text-center text-sm font-semibold text-ink transition hover:bg-black/5 active:scale-95"
              href="/login"
            >
              Get started
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA banner ──────────────────────────────────────── */}
      <section className="bg-ink py-16 lg:py-24">
        <div className="mx-auto max-w-2xl px-5 text-center">
          <h2 className="text-3xl font-bold text-white lg:text-4xl">
            Ready to create your event?
          </h2>
          <p className="mt-4 text-white/60">
            Set up a gallery in minutes. Share the link. Watch the photos roll in.
          </p>
          <Link
            className="mt-8 inline-block rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-ink shadow-sm transition hover:bg-white/90 active:scale-95"
            href="/login"
          >
            Create an event for free
          </Link>
        </div>
      </section>

      {/* ── Footer (desktop) ─────────────────────────────────── */}
      <footer className="hidden border-t border-black/5 bg-white px-8 py-8 lg:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Image alt="beenThere" height={30} src="/logo.webp" width={120} />
          <p className="text-xs text-ink-muted">© 2026 beenThere. All rights reserved.</p>
          <div className="flex gap-5 text-xs text-ink-muted">
            <Link className="hover:text-ink transition" href="#">Privacy</Link>
            <Link className="hover:text-ink transition" href="#">Terms</Link>
            <Link className="hover:text-ink transition" href="#">Contact</Link>
          </div>
        </div>
      </footer>

      {/* ── Mobile bottom tab bar ───────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-black/5 bg-white/85 px-2 pb-6 pt-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-around">
          {[
            { icon: "⊞", label: "Home", active: true, href: "/" },
            { icon: "🔍", label: "Explore", href: "/join/demo-join-token" },
            { cta: true, href: "/login" },
            { icon: "🔖", label: "Saved", href: "/login" },
            { icon: "👤", label: "Profile", href: "/dashboard" },
          ].map((tab, i) =>
            tab.cta ? (
              <Link
                className="flex size-12 items-center justify-center rounded-full bg-ink shadow-lg"
                href={tab.href!}
                key="cta"
              >
                <span className="text-xl font-light text-white leading-none">+</span>
              </Link>
            ) : (
              <Link className="flex flex-col items-center gap-1" href={tab.href!} key={i}>
                <span className={`text-xl leading-none ${tab.active ? "opacity-100" : "opacity-30"}`}>
                  {tab.icon}
                </span>
                <span className={`text-[10px] font-medium ${tab.active ? "text-ink" : "text-ink-muted"}`}>
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
