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
    <section className="rounded-3xl bg-amber-50 p-5 ring-1 ring-amber-200">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-amber-900">
            This event is a draft — guests can&apos;t join yet.
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Take it live to unlock the join QR, uploads, and the guest
            gallery.
          </p>
          {error ? (
            <p className="mt-2 text-sm font-medium text-red-700">{error}</p>
          ) : null}
        </div>
        <button
          className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-surface transition hover:bg-ink/90 disabled:opacity-60"
          disabled={isActivating}
          onClick={() => void activate()}
          type="button"
        >
          {isActivating ? "Activating…" : "Go live"}
        </button>
      </div>
    </section>
  );
}
