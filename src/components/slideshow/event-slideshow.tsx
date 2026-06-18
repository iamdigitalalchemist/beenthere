"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { EventRecord, PhotoRecord } from "@/types/domain";

const SLIDE_DURATION_MS = 6000;

type EventSlideshowProps = {
  event: EventRecord;
  initialPhotos: PhotoRecord[];
  joinPath: string;
};

type PhotosResponse = {
  photos: PhotoRecord[];
};

function getVisibleReadyPhotos(photos: PhotoRecord[]) {
  return photos.filter(
    (photo) => photo.status === "ready" && photo.visibility === "visible",
  );
}

export function EventSlideshow({
  event,
  initialPhotos,
  joinPath,
}: EventSlideshowProps) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const visiblePhotos = useMemo(() => getVisibleReadyPhotos(photos), [photos]);
  const safeActiveIndex =
    visiblePhotos.length === 0 ? 0 : activeIndex % visiblePhotos.length;
  const activePhoto = visiblePhotos[safeActiveIndex];

  useEffect(() => {
    queueMicrotask(() => {
      setLastUpdatedAt(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    });
  }, []);

  useEffect(() => {
    if (isPaused || visiblePhotos.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % visiblePhotos.length);
    }, SLIDE_DURATION_MS);

    return () => window.clearInterval(intervalId);
  }, [isPaused, visiblePhotos.length]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel(`event-slideshow:${event.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "beenthere",
          table: "photos",
          filter: `event_id=eq.${event.id}`,
        },
        async () => {
          const response = await fetch(`/api/events/${event.id}/photos`);
          const body = (await response.json()) as PhotosResponse;

          setPhotos(getVisibleReadyPhotos(body.photos));
          setLastUpdatedAt(
            new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [event.id]);

  function showPreviousPhoto() {
    setActiveIndex((currentIndex) =>
      currentIndex === 0 ? Math.max(visiblePhotos.length - 1, 0) : currentIndex - 1,
    );
  }

  function showNextPhoto() {
    setActiveIndex((currentIndex) =>
      visiblePhotos.length === 0 ? 0 : (currentIndex + 1) % visiblePhotos.length,
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative flex min-h-screen flex-col overflow-hidden">
        {activePhoto ? (
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Event slideshow photo"
              className="h-full w-full object-contain"
              src={activePhoto.previewUrl || activePhoto.thumbnailUrl}
            />
          </div>
        ) : (
          <div
            className="absolute inset-0 grid place-items-center px-6 text-center"
            style={{ background: "linear-gradient(180deg, #090918 0%, #10122C 100%)" }}
          >
            {/* Ambient glow */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(circle at 50% 40%, rgba(117,84,255,.18) 0%, transparent 60%)" }}
            />
            <div className="relative z-10">
              <p
                className="text-sm font-semibold uppercase tracking-[0.3em]"
                style={{
                  background: "linear-gradient(135deg, #FF6AA9, #B65DFF)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Waiting for photos
              </p>
              <h1
                className="mt-4 text-5xl font-semibold"
                style={{ color: "rgba(255,255,255,.92)", letterSpacing: "-0.02em" }}
              >
                {event.name}
              </h1>
              <p className="mt-4 text-lg" style={{ color: "rgba(255,255,255,.45)" }}>
                Scan the event QR code to add the first photos.
              </p>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 to-transparent p-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p
                className="text-sm font-semibold uppercase tracking-[0.28em]"
                style={{
                  background: "linear-gradient(135deg, #FF6AA9, #B65DFF)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Live event wall
              </p>
              <h1
                className="mt-2 text-3xl font-semibold tracking-tight"
                style={{ color: "rgba(255,255,255,.92)" }}
              >
                {event.name}
              </h1>
            </div>
            <div
              className="rounded-2xl px-4 py-3 text-right"
              style={{
                background: "rgba(255,255,255,.08)",
                border: "1px solid rgba(255,255,255,.12)",
                backdropFilter: "blur(12px)",
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: "rgba(255,255,255,.40)" }}
              >
                Scan to join
              </p>
              <p className="mt-1 font-mono text-sm" style={{ color: "rgba(255,255,255,.80)" }}>{joinPath}</p>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm" style={{ color: "rgba(255,255,255,.55)" }}>
                {visiblePhotos.length} photo{visiblePhotos.length === 1 ? "" : "s"}
                {lastUpdatedAt ? ` · Updated ${lastUpdatedAt}` : ""}
              </p>
            </div>
            <div className="pointer-events-auto flex gap-2">
              <button
                className="rounded-full px-4 py-2 text-sm font-semibold backdrop-blur transition hover:brightness-110"
                onClick={showPreviousPhoto}
                style={{ background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.15)", color: "rgba(255,255,255,.80)" }}
                type="button"
              >
                Previous
              </button>
              <button
                className="rounded-full px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"
                onClick={() => setIsPaused((currentValue) => !currentValue)}
                style={{ background: "linear-gradient(135deg, #FF6DAE, #B35DFF)", boxShadow: "0 4px 16px rgba(205,95,255,.25)" }}
                type="button"
              >
                {isPaused ? "Resume" : "Pause"}
              </button>
              <button
                className="rounded-full px-4 py-2 text-sm font-semibold backdrop-blur transition hover:brightness-110"
                onClick={showNextPhoto}
                style={{ background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.15)", color: "rgba(255,255,255,.80)" }}
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
