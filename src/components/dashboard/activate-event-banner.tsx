"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { readJsonResponse } from "@/lib/read-json-response";

type ActivateEventBannerProps = {
  eventPublicId: string;
};

type ActivateResponse = {
  error?: string;
  code?: string;
};

export function ActivateEventBanner({ eventPublicId }: ActivateEventBannerProps) {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>();
  const [isActivating, setIsActivating] = useState(false);

  async function activate() {
    setIsActivating(true);
    setError(undefined);

    const response = await fetch(`/api/events/${eventPublicId}/activate`, {
      method: "POST",
    });

    if (response.ok) {
      router.refresh();
      return;
    }

    const body = await readJsonResponse<ActivateResponse>(response);

    if (response.status === 402) {
      router.push(`/dashboard/events/${eventPublicId}/upgrade`);
      return;
    }

    setIsActivating(false);
    setError(body?.error ?? "Could not activate the event. Try again.");
  }

  return (
    <section
      className="rounded-3xl p-5"
      style={{
        background: "rgba(255,190,85,.08)",
        border: "1px solid rgba(255,190,85,.18)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold" style={{ color: "#FFBE55" }}>
            This event is a draft — guests can&apos;t join yet.
          </p>
          <p className="mt-1 text-sm" style={{ color: "rgba(255,190,85,.70)" }}>
            Take it live to unlock the join QR, uploads, and the guest gallery.
          </p>
          {error ? (
            <p className="mt-2 text-sm font-medium" style={{ color: "#FF8FA3" }}>{error}</p>
          ) : null}
        </div>
        <button
          className="shrink-0 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95 disabled:opacity-50"
          disabled={isActivating}
          onClick={() => void activate()}
          style={{ background: "linear-gradient(135deg, #FF6DAE, #B35DFF)", boxShadow: "0 4px 16px rgba(205,95,255,.25)" }}
          type="button"
        >
          {isActivating ? "Activating…" : "Go live"}
        </button>
      </div>
    </section>
  );
}
