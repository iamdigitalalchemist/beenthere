"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { readJsonResponse } from "@/lib/read-json-response";
import type { EventRecord, EventTemplate } from "@/types/domain";

const templates: { value: EventTemplate; label: string }[] = [
  { value: "wedding", label: "Wedding" },
  { value: "birthday", label: "Birthday" },
  { value: "party", label: "Party" },
  { value: "corporate", label: "Corporate" },
  { value: "graduation", label: "Graduation" },
  { value: "reunion", label: "Reunion" },
  { value: "conference", label: "Conference" },
  { value: "other", label: "Something else" },
];

type CreateEventResponse = {
  event?: EventRecord;
  error?: string;
};

function todayLocalDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function CreateEventForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [template, setTemplate] = useState<EventTemplate>("party");
  const [startsAt, setStartsAt] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = todayLocalDateString();

  async function handleSubmit(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    setIsSubmitting(true);
    setError(undefined);

    if (startsAt && startsAt < today) {
      setError("Event date must be today or in the future.");
      setIsSubmitting(false);
      return;
    }

    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        template,
        startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
      }),
    });
    const body = await readJsonResponse<CreateEventResponse>(response);

    if (!response.ok || !body?.event) {
      setIsSubmitting(false);
      setError(body?.error ?? "Could not create the event. Try again.");
      return;
    }

    router.push(`/dashboard/events/${body.event.publicId}`);
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-ink">Event name</span>
        <input
          className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          maxLength={80}
          minLength={3}
          onChange={(event) => setName(event.target.value)}
          placeholder="Lena & Sam's Wedding"
          required
          value={name}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-ink">Type of event</span>
        <select
          className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          onChange={(event) => setTemplate(event.target.value as EventTemplate)}
          value={template}
        >
          {templates.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-ink">Event date</span>
        <input
          className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          min={today}
          onChange={(event) => setStartsAt(event.target.value)}
          type="date"
          value={startsAt}
        />
        <span className="text-xs text-ink-muted">
          Uploads stay open for 24 hours after the event; the gallery lives
          for 30 days.
        </span>
      </label>

      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <button
        className="rounded-full bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-ink/80 active:scale-95 disabled:opacity-50"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Creating…" : "Create draft event"}
      </button>
      <p className="text-xs text-ink-muted">
        Drafts are free. You&apos;ll activate the event when you&apos;re ready
        to go live.
      </p>
    </form>
  );
}
