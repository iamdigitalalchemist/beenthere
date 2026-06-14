import Image from "next/image";
import Link from "next/link";
import { DEMO_PHOTOS } from "@/lib/demo-data";

const CATEGORIES = [
  { label: "All Events", active: true },
  { label: "Weddings" },
  { label: "Parties" },
  { label: "Travel" },
  { label: "Birthdays" },
  { label: "Conferences" },
];

const DEMO_EVENTS = [
  { id: "beach", name: "Beach Party '24", date: "14 Jun 2026 · San Diego", photos: 48, guests: 12 },
  { id: "sophia", name: "Sophie & Mark", date: "10 Jun 2026 · Malibu", photos: 31, guests: 8 },
  { id: "hiking", name: "Hiking Trip", date: "05 Jun 2026 · Yosemite", photos: 62, guests: 20 },
  { id: "summer", name: "Summer Fête", date: "01 Jun 2026 · Miami", photos: 77, guests: 34 },
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

const RECENT = [
  { id: "sunset", name: "Sunset Picnic", date: "12 Jun 2026 · San Diego", guests: 14 },
  { id: "rooftop", name: "Rooftop Sessions", date: "08 Jun 2026 · New York", guests: 22 },
];

export default function Home() {
  const covers = DEMO_PHOTOS.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-ink">

      {/* ── Desktop nav ─────────────────────────────────────── */}
      <header className="sticky top-0 z-20 hidden border-b border-black/5 bg-white/80 backdrop-blur-xl lg:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-3">
          <Image alt="beenThere" height={18} src="/logo.webp" width={72} />
          <nav className="flex items-center gap-7 text-sm font-medium text-ink-muted">
            <Link className="text-ink" href="/">Home</Link>
            <Link className="hover:text-ink transition" href="/join/demo-join-token">Demo</Link>
            <Link className="hover:text-ink transition" href="#features">Features</Link>
            <Link className="hover:text-ink transition" href="#pricing">Pricing</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link className="text-sm font-medium text-ink-muted hover:text-ink transition" href="/login">
              Sign in
            </Link>
            <Link
              className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-ink/80 active:scale-95"
              href="/login"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Mobile nav ──────────────────────────────────────── */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-black/5 bg-white/80 px-5 py-2.5 backdrop-blur-xl lg:hidden">
        <Image alt="beenThere" height={16} src="/logo.webp" width={66} />
        <Link
          className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white shadow-sm"
          href="/login"
        >
          Get started
        </Link>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-5 pb-12 pt-12 lg:px-8 lg:pb-20 lg:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">

            {/* Left copy */}
            <div className="relative z-10">
              <h1 className="text-[2.6rem] font-bold leading-[1.08] tracking-tight text-ink lg:text-6xl">
                Share moments.<br />
                <span className="text-accent">Any event.</span>
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-ink-muted lg:text-lg">
                Collect and share photos from your events in one beautiful private gallery. No app download, no group chat.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-ink/80 active:scale-95"
                  href="/login"
                >
                  Create an event
                </Link>
                <Link
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink shadow-sm ring-1 ring-black/8 transition hover:ring-black/20 active:scale-95"
                  href="/join/demo-join-token"
                >
                  Try demo →
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-10 flex gap-8">
                {[
                  ["10k+", "Events created"],
                  ["2.4M+", "Photos shared"],
                  ["150+", "Countries"],
                  ["4.9", "Rating"],
                ].map(([val, label]) => (
                  <div key={label}>
                    <p className="text-lg font-bold text-ink">{val}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — floating photo collage */}
            <div className="relative h-[420px] lg:h-[500px]">
              {/* Frosted sphere */}
              <div className="absolute right-8 top-0 size-64 rounded-full bg-gradient-to-br from-white/70 to-accent/10 shadow-[inset_-12px_-12px_32px_rgba(255,255,255,0.7),inset_12px_12px_32px_rgba(0,0,0,0.03),0_32px_80px_rgba(0,188,212,0.12)] backdrop-blur-sm lg:size-80" />
              {/* Small sphere */}
              <div className="absolute bottom-16 right-4 size-14 rounded-full bg-gradient-to-br from-white/90 to-accent/30 shadow-[0_12px_32px_rgba(0,188,212,0.2)]" />
              {/* Tiny sphere */}
              <div className="absolute right-28 top-8 size-6 rounded-full bg-white shadow-md ring-1 ring-black/5" />

              {/* Photo card 1 — large */}
              {covers[0] && (
                <div className="absolute left-0 top-8 h-52 w-40 overflow-hidden rounded-[1.75rem] shadow-[0_24px_64px_rgba(0,0,0,0.18)] ring-2 ring-white lg:h-64 lg:w-48">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="" className="size-full object-cover" src={covers[0].thumbnailUrl} />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <p className="text-[11px] font-semibold text-white">Summer Wedding</p>
                    <p className="text-[9px] text-white/70">42 photos</p>
                  </div>
                </div>
              )}

              {/* Photo card 2 */}
              {covers[1] && (
                <div className="absolute right-4 top-12 h-40 w-32 overflow-hidden rounded-[1.5rem] shadow-[0_16px_48px_rgba(0,0,0,0.16)] ring-2 ring-white lg:h-52 lg:w-40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="" className="size-full object-cover" src={covers[1].thumbnailUrl} />
                </div>
              )}

              {/* Photo card 3 */}
              {covers[2] && (
                <div className="absolute bottom-8 left-10 h-36 w-28 overflow-hidden rounded-[1.5rem] shadow-[0_12px_40px_rgba(0,0,0,0.15)] ring-2 ring-white lg:h-44 lg:w-36">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="" className="size-full object-cover" src={covers[2].thumbnailUrl} />
                </div>
              )}

              {/* Floating pill */}
              <div className="absolute bottom-20 right-8 rounded-2xl bg-white/80 px-4 py-2.5 shadow-md backdrop-blur-md ring-1 ring-black/5">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    {[...Array(3)].map((_, i) => (
                      <div className="size-5 rounded-full border-2 border-white bg-accent-soft" key={i} />
                    ))}
                  </div>
                  <p className="text-[11px] font-semibold text-ink">18 guests joined</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ──────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-10 lg:px-8">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {CATEGORIES.map((cat) => (
            <button
              className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition ${
                cat.active
                  ? "bg-ink text-white shadow-sm"
                  : "bg-white text-ink-muted shadow-sm ring-1 ring-black/8 hover:text-ink"
              }`}
              key={cat.label}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Discover events ─────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-14 lg:px-8">
        <h2 className="mb-5 text-lg font-bold">Discover events</h2>

        {/* Mobile: horizontal scroll */}
        <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] lg:hidden">
          {DEMO_EVENTS.map((event, i) => (
            <Link
              className="group relative shrink-0 w-44 overflow-hidden rounded-3xl shadow-md"
              href="/join/demo-join-token"
              key={event.id}
            >
              <div className="aspect-[3/4] w-full overflow-hidden bg-accent-soft">
                {covers[i] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" className="size-full object-cover transition duration-300 group-hover:scale-105" src={covers[i]?.thumbnailUrl} />
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute left-2.5 top-2.5 rounded-full bg-white/20 px-2.5 py-1 backdrop-blur-md">
                <p className="text-[10px] font-semibold text-white">{event.guests} guests</p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-[13px] font-bold leading-tight text-white">{event.name}</p>
                <p className="mt-0.5 text-[10px] text-white/70">{event.date}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Desktop: grid */}
        <div className="hidden gap-5 lg:grid lg:grid-cols-4">
          {DEMO_EVENTS.map((event, i) => (
            <Link
              className="group relative overflow-hidden rounded-3xl shadow-md"
              href="/join/demo-join-token"
              key={event.id}
            >
              <div className="aspect-[3/4] w-full overflow-hidden bg-accent-soft">
                {covers[i] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" className="size-full object-cover transition duration-500 group-hover:scale-105" src={covers[i]?.thumbnailUrl} />
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute left-3 top-3 rounded-full bg-white/20 px-3 py-1 backdrop-blur-md">
                <p className="text-[11px] font-semibold text-white">{event.guests} guests</p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-sm font-bold leading-tight text-white">{event.name}</p>
                <p className="mt-1 text-[11px] text-white/70">{event.date}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="flex -space-x-1.5">
                    {[...Array(3)].map((_, j) => (
                      <div className="size-5 rounded-full border border-white/50 bg-white/30 backdrop-blur-sm" key={j} />
                    ))}
                  </div>
                  <p className="text-[10px] text-white/60">{event.photos} photos</p>
                </div>
              </div>
            </Link>
          ))}
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

      {/* ── Recently active ─────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-16 lg:px-8">
        <h2 className="mb-5 text-lg font-bold">Recently active</h2>
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2">
          {RECENT.map((item, i) => (
            <Link
              className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:shadow-soft active:scale-[0.99]"
              href="/join/demo-join-token"
              key={item.id}
            >
              <div className="size-14 shrink-0 overflow-hidden rounded-2xl bg-accent-soft">
                {covers[i + 2] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" className="size-full object-cover" src={covers[i + 2]?.thumbnailUrl} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{item.name}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{item.date}</p>
              </div>
              <div className="flex shrink-0 -space-x-2">
                {[...Array(4)].map((_, j) => (
                  <div className="size-7 rounded-full border-2 border-white bg-accent-soft" key={j} />
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── CTA banner ──────────────────────────────────────── */}
      <section className="bg-ink py-16 lg:py-24" id="pricing">
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
          <Image alt="beenThere" height={16} src="/logo.webp" width={66} />
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
