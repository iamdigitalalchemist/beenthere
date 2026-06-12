import Link from "next/link";
import { DEMO_PHOTOS } from "@/lib/demo-data";

export default function Home() {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-14 px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-accent">
              BeenThere
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
              Private photo galleries for any event.
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-ink-muted">
              Guests scan a QR code to see and share event photos. No app
              download, no group chat, no exchanging contact details.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="rounded-full bg-ink px-6 py-3 text-center text-sm font-bold text-surface transition hover:bg-ink/90"
                href="/join/demo-join-token"
              >
                Try demo event
              </Link>
              <a
                className="rounded-full border border-border bg-surface px-6 py-3 text-center text-sm font-bold text-ink transition hover:border-accent/40"
                href="#scope"
              >
                View v1 scope
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] bg-surface p-4 shadow-soft ring-1 ring-border">
            <div className="grid grid-cols-3 gap-2">
              {DEMO_PHOTOS.map((photo, index) => (
                <div
                  className={`overflow-hidden rounded-2xl ${
                    index === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"
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
              <div className="flex aspect-square items-center justify-center rounded-2xl bg-accent-soft text-center">
                <p className="px-2 text-sm font-semibold text-accent">
                  + yours
                </p>
              </div>
            </div>
            <p className="mt-5 text-center text-lg font-semibold">
              Scan to see everyone&apos;s photos
            </p>
            <p className="mt-1 text-center text-sm text-ink-muted">
              Add yours without joining a group chat.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3" id="scope">
          {[
            ["View first", "Guests can browse after link or PIN access."],
            ["Upload safely", "Display name and consent appear before upload."],
            [
              "Export originals",
              "Hosts keep full-quality files while browsing stays optimized.",
            ],
          ].map(([title, body]) => (
            <article
              className="rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-border"
              key={title}
            >
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="mt-3 text-ink-muted">{body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
