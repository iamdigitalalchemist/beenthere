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
    <main
      className="min-h-screen px-6 py-16"
      style={{ background: "linear-gradient(180deg, #090918 0%, #10122C 40%, #0C0D20 100%)" }}
    >
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "radial-gradient(circle at 50% 0%, rgba(117,84,255,.15) 0%, transparent 60%)" }}
      />
      <section className="relative z-10 mx-auto flex max-w-sm flex-col items-center">
        <Image alt="beenThere" className="mb-8 brightness-0 invert opacity-80" height={24} src="/logo.webp" width={96} />
        <div className="text-center">
          <h1
            className="text-3xl font-bold sm:text-4xl"
            style={{ color: "rgba(255,255,255,.92)", letterSpacing: "-0.02em" }}
          >
            {event.name}
          </h1>
          <p className="mt-3 text-lg" style={{ color: "rgba(255,255,255,.45)" }}>
            Enter the event PIN to open the gallery.
          </p>
        </div>

        <form
          className="mt-8 w-full rounded-3xl p-7"
          onSubmit={handleSubmit}
          style={{
            background: "rgba(255,255,255,.04)",
            border: "1px solid rgba(255,255,255,.08)",
            backdropFilter: "blur(18px)",
            boxShadow: "0 8px 32px rgba(0,0,0,.32)",
          }}
        >
          <label
            className="block text-xs font-semibold uppercase tracking-widest"
            htmlFor="event-pin"
            style={{ color: "rgba(255,255,255,.30)", letterSpacing: "0.08em" }}
          >
            Event PIN
          </label>
          <input
            autoCapitalize="off"
            autoComplete="one-time-code"
            autoCorrect="off"
            className="mt-3 w-full rounded-2xl px-4 py-3.5 text-center text-2xl font-bold tracking-[0.3em] outline-none transition"
            id="event-pin"
            inputMode="text"
            maxLength={12}
            onChange={(inputEvent) => setPin(inputEvent.target.value.trim())}
            placeholder="••••"
            required
            spellCheck={false}
            style={{
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.12)",
              color: "rgba(255,255,255,.92)",
            }}
            type="text"
            value={pin}
          />
          {error ? (
            <p className="mt-3 text-sm" style={{ color: "#FF8FA3" }}>{error}</p>
          ) : (
            <p className="mt-3 text-xs" style={{ color: "rgba(255,255,255,.25)" }}>
              Ask the host if you do not have the PIN yet.
            </p>
          )}
          <button
            className="mt-6 w-full rounded-full py-3.5 text-sm font-bold text-white transition hover:brightness-110 active:scale-95 disabled:opacity-40"
            disabled={isSubmitting || pin.trim().length < 4}
            style={{ background: "linear-gradient(135deg, #FF6DAE, #B35DFF)", boxShadow: "0 12px 40px rgba(205,95,255,.25)" }}
            type="submit"
          >
            {isSubmitting ? "Opening gallery..." : "Open gallery"}
          </button>
        </form>
      </section>
    </main>
  );
}
