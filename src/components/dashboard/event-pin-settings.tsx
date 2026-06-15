"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type EventPinSettingsProps = {
  eventPublicId: string;
  pinEnabled: boolean;
};

type PinSettingsResponse = {
  pinEnabled?: boolean;
  error?: string;
};

export function EventPinSettings({
  eventPublicId,
  pinEnabled,
}: EventPinSettingsProps) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function savePin(eventForm: FormEvent<HTMLFormElement>) {
    eventForm.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/events/${eventPublicId}/pin`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pin }),
    });
    const data = (await response.json()) as PinSettingsResponse;

    if (!response.ok) {
      setError(data.error ?? "Could not save PIN.");
      setIsSubmitting(false);
      return;
    }

    setPin("");
    setMessage(data.pinEnabled ? "Gallery PIN enabled." : "Gallery PIN removed.");
    setIsSubmitting(false);
    router.refresh();
  }

  async function removePin() {
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/events/${eventPublicId}/pin`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pin: null }),
    });
    const data = (await response.json()) as PinSettingsResponse;

    if (!response.ok) {
      setError(data.error ?? "Could not remove PIN.");
      setIsSubmitting(false);
      return;
    }

    setPin("");
    setMessage("Gallery PIN removed.");
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Gallery PIN</p>
      <p className="mt-2 text-sm text-ink-muted">
        {pinEnabled
          ? "Guests must enter a PIN after scanning the QR code."
          : "No PIN required — guests open the gallery directly from the join link."}
      </p>

      <form className="mt-4 flex flex-col gap-3" onSubmit={savePin}>
        <input
          autoComplete="new-password"
          className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          maxLength={12}
          onChange={(inputEvent) => setPin(inputEvent.target.value)}
          placeholder={pinEnabled ? "Set a new PIN" : "Choose a 4–12 character PIN"}
          type="password"
          value={pin}
        />
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting || pin.trim().length < 4}
            type="submit"
          >
            {pinEnabled ? "Update PIN" : "Enable PIN"}
          </button>
          {pinEnabled ? (
            <button
              className="rounded-full border border-black/10 bg-black/5 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 active:scale-95 disabled:opacity-50"
              disabled={isSubmitting}
              onClick={removePin}
              type="button"
            >
              Remove PIN
            </button>
          ) : null}
        </div>
      </form>

      {error ? <p className="mt-3 text-sm text-rose-500">{error}</p> : null}
      {message ? <p className="mt-3 text-sm font-medium text-accent">{message}</p> : null}
    </article>
  );
}
