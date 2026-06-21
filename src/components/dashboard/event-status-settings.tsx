"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type EventStatusSettingsProps = {
  eventPublicId: string;
  status: "draft" | "active" | "ended" | "expired";
  startsAt: string;
};

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,.04)",
  border: "1px solid rgba(255,255,255,.08)",
  backdropFilter: "blur(18px)",
  boxShadow: "0 8px 32px rgba(0,0,0,.32)",
};

export function EventStatusSettings({ eventPublicId, status, startsAt }: EventStatusSettingsProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const withinReopenWindow =
    new Date() < new Date(new Date(startsAt).getTime() + 48 * 60 * 60 * 1000);

  async function closeEvent() {
    setIsSubmitting(true);
    setError(null);
    const response = await fetch(`/api/events/${eventPublicId}/close`, { method: "POST" });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Could not close event.");
      setIsSubmitting(false);
      return;
    }
    setShowConfirm(false);
    router.refresh();
    setIsSubmitting(false);
  }

  async function reopenEvent() {
    setIsSubmitting(true);
    setError(null);
    const response = await fetch(`/api/events/${eventPublicId}/reopen`, { method: "POST" });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Could not reopen event.");
      setIsSubmitting(false);
      return;
    }
    router.refresh();
    setIsSubmitting(false);
  }

  if (status !== "active" && status !== "ended") return null;

  return (
    <article className="rounded-3xl p-6" style={glass}>
      <p
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "rgba(255,255,255,.30)", letterSpacing: "0.08em" }}
      >
        Event status
      </p>

      {status === "active" && (
        <>
          <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,.45)" }}>
            Closing the event will immediately disable the guest gallery, join link, and slideshow.
          </p>

          {showConfirm ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <p className="w-full text-sm font-semibold" style={{ color: "rgba(255,255,255,.70)" }}>
                Are you sure? Guests will lose access immediately.
              </p>
              <button
                className="rounded-full px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110 active:scale-95 disabled:opacity-50"
                disabled={isSubmitting}
                onClick={() => void closeEvent()}
                style={{ background: "#FF5F7B" }}
                type="button"
              >
                {isSubmitting ? "Closing…" : "Yes, close event"}
              </button>
              <button
                className="rounded-full px-5 py-2.5 text-sm font-semibold transition active:scale-95"
                disabled={isSubmitting}
                onClick={() => setShowConfirm(false)}
                style={{ color: "rgba(255,255,255,.40)" }}
                type="button"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="mt-4 rounded-full px-5 py-2.5 text-sm font-semibold transition hover:brightness-110 active:scale-95"
              onClick={() => setShowConfirm(true)}
              style={{
                background: "rgba(255,95,123,.10)",
                border: "1px solid rgba(255,95,123,.15)",
                color: "#FF8FA3",
              }}
              type="button"
            >
              Close event
            </button>
          )}
        </>
      )}

      {status === "ended" && (
        <>
          <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,.45)" }}>
            This event is closed. The guest gallery, join link, and slideshow are disabled.
          </p>
          {withinReopenWindow ? (
            <>
              <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,.30)" }}>
                You can reopen this event — you&apos;re still within the 48-hour window.
              </p>
              <button
                className="mt-4 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95 disabled:opacity-50"
                disabled={isSubmitting}
                onClick={() => void reopenEvent()}
                style={{ background: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.12)" }}
                type="button"
              >
                {isSubmitting ? "Reopening…" : "Reopen event"}
              </button>
            </>
          ) : (
            <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,.30)" }}>
              The 48-hour reopen window has passed.
            </p>
          )}
        </>
      )}

      {error && <p className="mt-3 text-sm" style={{ color: "#FF8FA3" }}>{error}</p>}
    </article>
  );
}
