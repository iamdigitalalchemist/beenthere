import Image from "next/image";
import Link from "next/link";
import { DEMO_PHOTOS } from "@/lib/demo-data";

const CATEGORIES = [
  { label: "All Events", icon: "◈", active: true },
  { label: "Weddings", icon: "💍" },
  { label: "Parties", icon: "🎉" },
  { label: "Travel", icon: "✈️" },
  { label: "Birthdays", icon: "🎂" },
  { label: "Conferences", icon: "🎙️" },
  { label: "Other", icon: "···" },
];

const DEMO_EVENTS = [
  { id: "beach", name: "Beach Party '24", date: "14 June 2026 · San Diego", photos: 48, guests: 12 },
  { id: "sophia", name: "Sophie & Mark", date: "10 June 2026 · Malibu", photos: 31, guests: 8 },
  { id: "hiking", name: "Hiking Trip", date: "05 June 2026 · Yosemite", photos: 62, guests: 20 },
  { id: "summer", name: "Summer Fête", date: "01 June 2026 · Miami", photos: 77, guests: 34 },
];

const RECENT = [
  { id: "sunset", name: "Sunset Picnic", date: "12 June 2026 · San Diego", guests: 14 },
];

export default function Home() {
  const coverPhotos = DEMO_PHOTOS.slice(0, 4);

  return (
    <div className="relative mx-auto min-h-screen max-w-sm overflow-hidden bg-[#f8f9fb] text-ink selection:bg-accent/20 sm:max-w-md">

      {/* Top nav */}
      <header className="flex items-center justify-between px-5 pb-2 pt-12">
        <Image alt="beenThere" height={28} src="/logo.webp" width={110} />
        <div className="flex items-center gap-2">
          <button className="flex size-9 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5">
            <span className="text-base leading-none">🔔</span>
          </button>
          <Link
            className="flex size-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-white shadow-sm"
            href="/dashboard"
          >
            M
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-6 pt-8">
        {/* Floating 3D blobs */}
        <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 translate-x-16 -translate-y-8">
          {/* Large frosted sphere */}
          <div className="absolute right-8 top-4 size-48 rounded-full bg-gradient-to-br from-white/80 to-white/20 shadow-[inset_-8px_-8px_24px_rgba(255,255,255,0.6),inset_8px_8px_24px_rgba(0,0,0,0.04),0_20px_60px_rgba(0,188,212,0.15)] backdrop-blur-sm" />
          {/* Small sphere */}
          <div className="absolute right-2 top-36 size-10 rounded-full bg-gradient-to-br from-white/90 to-accent/20 shadow-[0_8px_24px_rgba(0,188,212,0.2)]" />
          {/* Photo card floating */}
          {coverPhotos[0] && (
            <div className="absolute right-14 top-8 h-32 w-24 overflow-hidden rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] ring-2 ring-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" className="size-full object-cover" src={coverPhotos[0].thumbnailUrl} />
            </div>
          )}
          {coverPhotos[1] && (
            <div className="absolute right-2 top-20 h-24 w-20 overflow-hidden rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] ring-2 ring-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" className="size-full object-cover" src={coverPhotos[1].thumbnailUrl} />
            </div>
          )}
        </div>

        <div className="relative z-10 max-w-[55%]">
          <h1 className="text-[2.4rem] font-bold leading-[1.1] tracking-tight text-ink">
            Share moments.<br />Any event.
          </h1>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
            Collect and share photos from your events in one beautiful place.
          </p>
          <div className="mt-5 flex gap-2">
            <Link
              className="rounded-full bg-ink px-5 py-2.5 text-[13px] font-semibold text-white shadow-md transition active:scale-95"
              href="/login"
            >
              Create an event
            </Link>
            <Link
              className="flex items-center gap-1 rounded-full bg-white px-4 py-2.5 text-[13px] font-medium text-ink shadow-sm ring-1 ring-black/5 transition active:scale-95"
              href="/join/demo-join-token"
            >
              See more →
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-10 flex gap-6">
          {[
            ["10k+", "Events created"],
            ["2.4M+", "Photos shared"],
            ["150+", "Countries"],
            ["4.9", "Rating"],
          ].map(([val, label]) => (
            <div key={label}>
              <p className="text-sm font-bold text-ink">{val}</p>
              <p className="mt-0.5 text-[10px] text-ink-muted">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Search */}
      <div className="px-5 pb-5">
        <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/5">
          <span className="text-ink-muted">🔍</span>
          <input
            className="flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-muted/60"
            placeholder="Search events, people, photos..."
            readOnly
          />
          <button className="flex items-center gap-1 rounded-xl bg-canvas px-3 py-1 text-[11px] font-medium text-ink-muted ring-1 ring-black/5">
            <span>⚙</span> Filter
          </button>
        </div>
      </div>

      {/* Explore by category */}
      <section className="pb-6">
        <div className="mb-3 flex items-center justify-between px-5">
          <h2 className="text-[15px] font-bold">Explore by category</h2>
          <button className="text-[12px] font-medium text-accent">View all</button>
        </div>
        <div className="flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
          {CATEGORIES.map((cat) => (
            <button
              className={`flex shrink-0 flex-col items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[11px] font-medium transition ${
                cat.active
                  ? "bg-ink text-white shadow-md"
                  : "bg-white text-ink shadow-sm ring-1 ring-black/5"
              }`}
              key={cat.label}
            >
              <span className="text-base leading-none">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Discover events */}
      <section className="pb-6">
        <div className="mb-3 flex items-center justify-between px-5">
          <h2 className="text-[15px] font-bold">Discover events</h2>
          <button className="text-[12px] font-medium text-accent">View all</button>
        </div>
        <div className="flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none]">
          {DEMO_EVENTS.map((event, i) => (
            <Link
              className="group relative shrink-0 w-44 overflow-hidden rounded-3xl shadow-md"
              href="/join/demo-join-token"
              key={event.id}
            >
              {/* Cover photo */}
              <div className="aspect-[3/4] w-full overflow-hidden bg-accent-soft">
                {coverPhotos[i] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={event.name}
                    className="size-full object-cover transition duration-300 group-hover:scale-105"
                    src={coverPhotos[i]?.thumbnailUrl}
                  />
                )}
              </div>
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              {/* Pill top-left */}
              <div className="absolute left-2.5 top-2.5 rounded-full bg-white/20 px-2.5 py-1 backdrop-blur-md">
                <p className="text-[10px] font-semibold text-white">{event.guests} guests</p>
              </div>
              {/* Text bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-[13px] font-bold leading-tight text-white">{event.name}</p>
                <p className="mt-0.5 text-[10px] text-white/70">{event.date}</p>
                {/* Avatar stack */}
                <div className="mt-2 flex items-center gap-1">
                  <div className="flex -space-x-1.5">
                    {[...Array(3)].map((_, j) => (
                      <div className="size-5 rounded-full border border-white/50 bg-white/30 backdrop-blur-sm" key={j} />
                    ))}
                  </div>
                  <p className="text-[9px] text-white/60">+{event.photos} photos</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recently active */}
      <section className="pb-32 ">
        <div className="mb-3 flex items-center justify-between px-5">
          <h2 className="text-[15px] font-bold">Recently active</h2>
          <button className="text-[12px] font-medium text-accent">View all</button>
        </div>
        <div className="px-5 flex flex-col gap-3">
          {RECENT.map((item) => (
            <Link
              className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5 transition active:scale-[0.98]"
              href="/join/demo-join-token"
              key={item.id}
            >
              <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-accent-soft">
                {coverPhotos[2] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" className="size-full object-cover" src={coverPhotos[2].thumbnailUrl} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate">{item.name}</p>
                <p className="text-[11px] text-ink-muted mt-0.5">{item.date}</p>
              </div>
              <div className="flex -space-x-1.5 shrink-0">
                {[...Array(4)].map((_, i) => (
                  <div className="size-6 rounded-full border-2 border-white bg-accent-soft" key={i} />
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-1/2 w-full max-w-sm -translate-x-1/2 border-t border-black/5 bg-white/80 px-2 pb-6 pt-3 backdrop-blur-xl sm:max-w-md">
        <div className="flex items-center justify-around">
          {[
            { icon: "⊞", label: "Home", active: true, href: "/" },
            { icon: "🔍", label: "Explore", active: false, href: "/join/demo-join-token" },
            { icon: null, label: "Add", active: false, href: "/login", cta: true },
            { icon: "🔖", label: "Saved", active: false, href: "/login" },
            { icon: "👤", label: "Profile", active: false, href: "/dashboard" },
          ].map((tab) =>
            tab.cta ? (
              <Link
                className="flex size-12 items-center justify-center rounded-full bg-ink shadow-lg"
                href={tab.href}
                key={tab.label}
              >
                <span className="text-xl font-light leading-none text-white">+</span>
              </Link>
            ) : (
              <Link
                className="flex flex-col items-center gap-1"
                href={tab.href}
                key={tab.label}
              >
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
    </div>
  );
}
