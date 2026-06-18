"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type EventPinSettingsProps = { eventPublicId: string; pinEnabled: boolean };
type PinSettingsResponse = { pinEnabled?: boolean; error?: string };

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,.04)",
  border: "1px solid rgba(255,255,255,.08)",
  backdropFilter: "blur(18px)",
  boxShadow: "0 8px 32px rgba(0,0,0,.32)",
};

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.10)",
  color: "rgba(255,255,255,.92)",
  borderRadius: "16px",
  padding: "12px 16px",
  fontSize: "16px",
  outline: "none",
  width: "100%",
};

export function EventPinSettings({ eventPublicId, pinEnabled }: EventPinSettingsProps) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function savePin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);
    const response = await fetch(`/api/events/${eventPublicId}/pin`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const data = (await response.json()) as PinSettingsResponse;
    if (!response.ok) { setError(data.error ?? "Could not save PIN."); setIsSubmitting(false); return; }
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: null }),
    });
    const data = (await response.json()) as PinSettingsResponse;
    if (!response.ok) { setError(data.error ?? "Could not remove PIN."); setIsSubmitting(false); return; }
    setPin("");
    setMessage("Gallery PIN removed.");
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <article className="rounded-3xl p-6" style={glass}>
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,.30)", letterSpacing: "0.08em" }}>Gallery PIN</p>
      <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,.45)" }}>
        {pinEnabled
          ? "Guests must enter a PIN after scanning the QR code."
          : "No PIN required — guests open the gallery directly from the join link."}
      </p>
      <form className="mt-4 flex flex-col gap-3" onSubmit={savePin}>
        <input
          autoComplete="new-password"
          maxLength={12}
          onChange={(e) => setPin(e.target.value)}
          placeholder={pinEnabled ? "Set a new PIN" : "Choose a 4–12 character PIN"}
          style={inputStyle}
          type="password"
          value={pin}
        />
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95 disabled:opacity-50"
            disabled={isSubmitting || pin.trim().length < 4}
            style={{ background: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.12)" }}
            type="submit"
          >
            {pinEnabled ? "Update PIN" : "Enable PIN"}
          </button>
          {pinEnabled && (
            <button
              className="rounded-full px-5 py-2.5 text-sm font-semibold transition active:scale-95 disabled:opacity-50"
              disabled={isSubmitting}
              onClick={removePin}
              style={{ background: "rgba(255,95,123,.10)", border: "1px solid rgba(255,95,123,.15)", color: "#FF8FA3" }}
              type="button"
            >
              Remove PIN
            </button>
          )}
        </div>
      </form>
      {error && <p className="mt-3 text-sm" style={{ color: "#FF8FA3" }}>{error}</p>}
      {message && (
        <p className="mt-3 text-sm font-medium" style={{
          background: "linear-gradient(135deg, #FF6AA9, #B65DFF)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>{message}</p>
      )}
    </article>
  );
}
