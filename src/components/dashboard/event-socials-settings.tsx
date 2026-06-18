"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { eventPublicId: string; collectSocials: boolean };

export function EventSocialsSettings({ eventPublicId, collectSocials: initial }: Props) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function toggle() {
    const next = !enabled;
    setEnabled(next);
    setIsSaving(true);
    setMessage(null);
    const response = await fetch(`/api/events/${eventPublicId}/socials`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collectSocials: next }),
    });
    setIsSaving(false);
    if (!response.ok) { setEnabled(!next); setMessage("Could not save. Try again."); return; }
    setMessage(next ? "Social accounts enabled." : "Social accounts disabled.");
    router.refresh();
  }

  return (
    <div
      className="rounded-3xl p-6"
      style={{
        background: "rgba(255,255,255,.04)",
        border: "1px solid rgba(255,255,255,.08)",
        backdropFilter: "blur(18px)",
        boxShadow: "0 8px 32px rgba(0,0,0,.32)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,.30)", letterSpacing: "0.08em" }}>
            Social accounts
          </p>
          <p className="mt-2 font-semibold" style={{ color: "rgba(255,255,255,.92)" }}>Collect guest social handles</p>
          <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,.45)" }}>
            When enabled, guests can optionally share their Instagram, TikTok, X, and Facebook when joining.
          </p>
          {message && (
            <p className="mt-2 text-sm font-medium" style={{
              background: "linear-gradient(135deg, #FF6AA9, #B65DFF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              {message}
            </p>
          )}
        </div>
        <button
          aria-label={enabled ? "Disable" : "Enable"}
          className="relative mt-1 shrink-0 h-7 w-12 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50"
          disabled={isSaving}
          onClick={toggle}
          style={{
            background: enabled
              ? "linear-gradient(135deg, #FF6DAE, #B35DFF)"
              : "rgba(255,255,255,.12)",
          }}
          type="button"
        >
          <span
            className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${enabled ? "translate-x-5" : "translate-x-0"}`}
          />
        </button>
      </div>
    </div>
  );
}
