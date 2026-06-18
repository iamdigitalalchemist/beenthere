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

type CreateEventResponse = { event?: EventRecord; error?: string };

function todayLocalDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.10)",
  color: "rgba(255,255,255,.92)",
  borderRadius: "16px",
  padding: "12px 16px",
  fontSize: "14px",
  outline: "none",
  width: "100%",
  transition: "border-color 150ms",
};

const labelStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  color: "rgba(255,255,255,.55)",
  display: "block",
  marginBottom: "8px",
};

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
      body: JSON.stringify({ name, template, startsAt: startsAt ? new Date(startsAt).toISOString() : undefined }),
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
      <label className="flex flex-col">
        <span style={labelStyle}>Event name</span>
        <input
          maxLength={80}
          minLength={3}
          onChange={(e) => setName(e.target.value)}
          placeholder="Lena & Sam's Wedding"
          required
          style={inputStyle}
          type="text"
          value={name}
        />
      </label>

      <label className="flex flex-col">
        <span style={labelStyle}>Type of event</span>
        <select
          onChange={(e) => setTemplate(e.target.value as EventTemplate)}
          style={{ ...inputStyle, appearance: "none" }}
          value={template}
        >
          {templates.map((option) => (
            <option key={option.value} style={{ background: "#0F1023" }} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col">
        <span style={labelStyle}>Event date</span>
        <input
          min={today}
          onChange={(e) => setStartsAt(e.target.value)}
          style={{ ...inputStyle, colorScheme: "dark" }}
          type="date"
          value={startsAt}
        />
        <span className="mt-2 text-xs" style={{ color: "rgba(255,255,255,.25)" }}>
          Uploads stay open for 24 hours after the event; the gallery lives for 30 days.
        </span>
      </label>

      {error && (
        <p
          className="rounded-2xl px-4 py-3 text-sm font-medium"
          style={{ background: "rgba(255,95,123,.12)", border: "1px solid rgba(255,95,123,.20)", color: "#FF8FA3" }}
        >
          {error}
        </p>
      )}

      <button
        className="rounded-full px-6 py-3 text-sm font-bold text-white transition hover:brightness-110 active:scale-95 disabled:opacity-50"
        disabled={isSubmitting}
        style={{
          background: "linear-gradient(135deg, #FF6DAE, #B35DFF)",
          boxShadow: "0 12px 40px rgba(205,95,255,.25)",
        }}
        type="submit"
      >
        {isSubmitting ? "Creating…" : "Create draft event"}
      </button>
      <p className="text-xs text-center" style={{ color: "rgba(255,255,255,.25)" }}>
        Drafts are free. You&apos;ll activate the event when you&apos;re ready to go live.
      </p>
    </form>
  );
}
