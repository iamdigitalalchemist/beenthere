"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  eventPublicId: string;
  collectSocials: boolean;
};

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

    if (!response.ok) {
      setEnabled(!next);
      setMessage("Could not save. Try again.");
      return;
    }

    setMessage(next ? "Social accounts enabled." : "Social accounts disabled.");
    router.refresh();
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Social accounts</p>
          <p className="mt-2 font-semibold">Collect guest social handles</p>
          <p className="mt-1 text-sm text-ink-muted">
            When enabled, guests can optionally share their Instagram, TikTok, X, and Facebook when joining the gallery.
          </p>
          {message && (
            <p className="mt-2 text-sm font-medium text-accent">{message}</p>
          )}
        </div>
        <button
          aria-label={enabled ? "Disable social accounts" : "Enable social accounts"}
          className={`relative mt-1 shrink-0 h-7 w-12 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50 ${
            enabled ? "bg-accent" : "bg-black/15"
          }`}
          disabled={isSaving}
          onClick={toggle}
          type="button"
        >
          <span
            className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
