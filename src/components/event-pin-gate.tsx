"use client";

import { FormEvent, useState } from "react";
import { readJsonResponse } from "@/lib/read-json-response";
import type { EventRecord } from "@/types/domain";

type EventPinGateProps = {
  event: EventRecord;
};

type PinResponse = {
  error?: string;
};

export function EventPinGate({ event }: EventPinGateProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(eventForm: FormEvent<HTMLFormElement>) {
    eventForm.preventDefault();

    const normalizedPin = pin.trim();
    if (normalizedPin.length < 4) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    let unlocked = false;

    try {
      const response = await fetch(`/api/events/${event.publicId}/pin`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pin: normalizedPin }),
      });
      const data = await readJsonResponse<PinResponse>(response);

      if (!response.ok) {
        setError(data?.error ?? "Incorrect PIN. Try again.");
        return;
      }

      unlocked = true;
      window.location.replace(
        `${window.location.pathname}${window.location.search}`,
      );
    } catch {
      setError("Could not verify PIN. Check your connection and try again.");
    } finally {
      if (!unlocked) {
        setIsSubmitting(false);
      }
    }
  }

  return (
    <main className="min-h-screen bg-canvas px-6 py-16 text-ink">
      <section className="mx-auto flex max-w-lg flex-col gap-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-accent">
            BeenThere
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            {event.name}
          </h1>
          <p className="mt-4 text-lg text-ink-muted">
            Enter the event PIN to open the gallery.
          </p>
        </div>

        <form
          className="rounded-[2rem] bg-surface p-8 shadow-soft ring-1 ring-border"
          onSubmit={handleSubmit}
        >
          <label
            className="block text-sm font-semibold text-ink"
            htmlFor="event-pin"
          >
            Event PIN
          </label>
          <input
            autoCapitalize="off"
            autoComplete="one-time-code"
            autoCorrect="off"
            className="mt-3 min-h-11 w-full rounded-2xl border border-border bg-canvas px-4 py-3 text-center text-2xl font-semibold tracking-[0.3em] text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            id="event-pin"
            inputMode="text"
            maxLength={12}
            onChange={(inputEvent) => setPin(inputEvent.target.value.trim())}
            placeholder="••••"
            required
            spellCheck={false}
            type="text"
            value={pin}
          />
          {error ? (
            <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>
          ) : (
            <p className="mt-3 text-sm text-ink-muted">
              Ask the host if you do not have the PIN yet.
            </p>
          )}
          <button
            className="mt-6 min-h-11 w-full touch-manipulation rounded-full bg-ink px-6 py-3 text-sm font-bold text-surface transition hover:bg-ink/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting || pin.trim().length < 4}
            type="submit"
          >
            {isSubmitting ? "Opening gallery..." : "Open gallery"}
          </button>
        </form>
      </section>
    </main>
  );
}
