import Image from "next/image";
import Link from "next/link";
import { DEMO_PHOTOS } from "@/lib/demo-data";

const DEMO_EVENTS = [
  {
    id: "beach",
    name: "Beach Party '24",
    photos: 48,
    guests: 12,
    cover: DEMO_PHOTOS[0]?.thumbnailUrl,
  },
  {
    id: "frames",
    name: "Frames & More",
    photos: 31,
    guests: 8,
    cover: DEMO_PHOTOS[1]?.thumbnailUrl,
  },
  {
    id: "hiking",
    name: "Hiking Trip",
    photos: 62,
    guests: 20,
    cover: DEMO_PHOTOS[2]?.thumbnailUrl,
  },
];

const CATEGORIES = [
  { label: "All", icon: "◈" },
  { label: "Weddings", icon: "💍" },
  { label: "Parties", icon: "🎉" },
  { label: "Travel", icon: "✈️" },
  { label: "Sports", icon: "⚽" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Nav */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface/90 px-5 py-3 backdrop-blur">
        <Image alt="beenThere" height={32} src="/logo.webp" width={120} />
        <div className="flex items-center gap-2">
          <Link
            className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-ink transition hover:border-accent"
            href="/login"
          >
            Sign in
          </Link>
          <Link
            className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
            href="/login"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <h1 className="text-5xl font-bold leading-tight tracking-tight text-ink sm:text-6xl">
              Share moments.
              <br />
              <span className="text-accent">Any event.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-muted">
              Collect and share photos from your events to one private gallery.
              No app, no group chat required.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover"
                href="/login"
              >
                Create an event →
              </Link>
              <Link
                className="rounded-full border border-border bg-surface px-6 py-3 text-sm font-semibold text-ink transition hover:border-accent/50"
                href="/join/demo-join-token"
              >
                Try demo event
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-10 flex gap-8">
              {[
                ["10k+", "Events created"],
                ["2.4M+", "Photos shared"],
                ["100+", "Countries"],
                ["4.9", "Rating"],
              ].map(([val, label]) => (
                <div key={label}>
                  <p className="text-xl font-bold text-ink">{val}</p>
                  <p className="text-xs text-ink-muted">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hero photo grid */}
          <div className="relative">
            <div className="rounded-3xl bg-surface p-4 shadow-soft ring-1 ring-border">
              <div className="grid grid-cols-3 gap-2">
                {DEMO_PHOTOS.slice(0, 5).map((photo, index) => (
                  <div
                    className={`overflow-hidden rounded-2xl ${
                      index === 0
                        ? "col-span-2 row-span-2 aspect-square"
                        : "aspect-square"
                    }`}
                    key={photo.id}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt=""
                      className="size-full object-cover"
                      src={photo.thumbnailUrl}
                    />
                  </div>
                ))}
                <div className="flex aspect-square items-center justify-center rounded-2xl bg-accent-soft">
                  <p className="text-sm font-semibold text-accent">+ yours</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-canvas px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">Summer Wedding 2024</p>
                  <p className="text-xs text-ink-muted">42 photos · 18 guests</p>
                </div>
                <div className="flex -space-x-2">
                  {[...Array(3)].map((_, i) => (
                    <div
                      className="size-7 rounded-full border-2 border-surface bg-accent-soft"
                      key={i}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -right-3 -top-3 rounded-2xl bg-accent px-3 py-2 shadow-md">
              <p className="text-xs font-bold text-white">Scan to join →</p>
            </div>
          </div>
        </div>
      </section>

      {/* Discover events */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">Discover events</h2>
          <Link className="text-sm font-medium text-accent" href="/join/demo-join-token">
            View all
          </Link>
        </div>

        {/* Categories */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat, i) => (
            <button
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                i === 0
                  ? "bg-accent text-white"
                  : "bg-surface text-ink ring-1 ring-border hover:ring-accent/50"
              }`}
              key={cat.label}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Event cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_EVENTS.map((event) => (
            <Link
              className="group overflow-hidden rounded-3xl bg-surface shadow-sm ring-1 ring-border transition hover:shadow-soft"
              href="/join/demo-join-token"
              key={event.id}
            >
              <div className="aspect-video w-full overflow-hidden bg-accent-soft">
                {event.cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={event.name}
                    className="size-full object-cover transition group-hover:scale-105"
                    src={event.cover}
                  />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold">{event.name}</h3>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex -space-x-1.5">
                    {[...Array(3)].map((_, i) => (
                      <div
                        className="size-6 rounded-full border-2 border-surface bg-accent-soft"
                        key={i}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-ink-muted">
                    {event.guests} guests · {event.photos} photos
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="mb-10 text-center text-2xl font-bold">
            Everything you need for event photos
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: "📸",
                title: "Instant gallery",
                body: "Guests scan a QR code and see every photo from the event in one place.",
              },
              {
                icon: "🔒",
                title: "Private by default",
                body: "PIN-protected access keeps your gallery visible only to the right people.",
              },
              {
                icon: "⬇️",
                title: "Export originals",
                body: "Hosts download full-quality originals. Guests browse optimized previews.",
              },
            ].map(({ icon, title, body }) => (
              <div
                className="rounded-3xl bg-canvas p-6 ring-1 ring-border"
                key={title}
              >
                <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-2xl">
                  {icon}
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h2 className="text-3xl font-bold">Ready to create your event?</h2>
        <p className="mt-4 text-ink-muted">
          Set up a gallery in minutes. Share the link. Watch the photos roll in.
        </p>
        <Link
          className="mt-8 inline-block rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover"
          href="/login"
        >
          Create an event for free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface px-5 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Image alt="beenThere" height={24} src="/logo.webp" width={90} />
          <p className="text-xs text-ink-muted">© 2026 beenThere</p>
        </div>
      </footer>
    </div>
  );
}
