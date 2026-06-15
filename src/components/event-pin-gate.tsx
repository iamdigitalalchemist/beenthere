"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
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
    <main className="min-h-screen bg-[#0f1117] px-6 py-16">
      <section className="mx-auto flex max-w-sm flex-col items-center">
        <Image
          src="/logo.webp"
          width={100}
          height={25}
          alt="BeenThere"
          className="brightness-0 invert mb-8"
        />
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {event.name}
          </h1>
          <p className="mt-3 text-lg text-white/50">
            Enter the event PIN to open the gallery.
          </p>
        </div>

        <form
          className="mt-8 w-full rounded-3xl bg-white/8 p-7 backdrop-blur-xl ring-1 ring-white/10"
          onSubmit={handleSubmit}
        >
          <label
            className="block text-xs font-semibold uppercase tracking-widest text-white/40"
            htmlFor="event-pin"
          >
            Event PIN
          </label>
          <input
            autoCapitalize="off"
            autoComplete="one-time-code"
            autoCorrect="off"
            className="mt-3 w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 text-center text-2xl font-bold tracking-[0.3em] text-white placeholder-white/20 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
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
            <p className="mt-3 text-sm text-rose-400">{error}</p>
          ) : (
            <p className="mt-3 text-xs text-white/30">
              Ask the host if you do not have the PIN yet.
            </p>
          )}
          <button
            className="mt-6 w-full rounded-full bg-accent py-3.5 text-sm font-bold text-white transition hover:bg-accent-hover active:scale-95 disabled:opacity-40"
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
