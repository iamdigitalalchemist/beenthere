"use client";

import { useState } from "react";
import type { UploadPolicy } from "@/types/domain";

const POLICIES: {
  value: UploadPolicy;
  label: string;
  description: string;
}[] = [
  {
    value: "open",
    label: "Open",
    description: "All uploads are immediately visible and added to the gallery.",
  },
  {
    value: "curated",
    label: "Curated",
    description: "Uploads are visible to everyone but you choose what goes in the gallery.",
  },
  {
    value: "strict",
    label: "Strict",
    description: "All uploads are hidden until you review and approve each one.",
  },
];

type Props = {
  eventPublicId: string;
  uploadPolicy: UploadPolicy;
};

export function UploadPolicySettings({ eventPublicId, uploadPolicy: initialPolicy }: Props) {
  const [policy, setPolicy] = useState<UploadPolicy>(initialPolicy);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const currentIndex = POLICIES.findIndex((p) => p.value === policy);

  async function save(next: UploadPolicy) {
    if (next === policy) return;
    setPolicy(next);
    setSaving(true);
    setMessage(null);

    const res = await fetch(`/api/events/${eventPublicId}/upload-policy`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadPolicy: next }),
    });

    setSaving(false);
    setMessage(res.ok ? "Saved." : "Could not save. Try again.");
    if (!res.ok) setPolicy(policy);
  }

  const current = POLICIES[currentIndex];

  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Upload moderation</p>
      <p className="mt-2 text-sm text-ink-muted">
        Control how guest uploads are handled when they arrive.
      </p>

      {/* Slider track */}
      <div className="mt-5">
        <div className="relative">
          {/* Track */}
          <div className="flex rounded-2xl bg-black/5 p-1 gap-1">
            {POLICIES.map((p) => (
              <button
                className={`flex-1 rounded-xl px-3 py-2.5 text-center transition active:scale-[0.98] ${
                  policy === p.value
                    ? "bg-white shadow-sm"
                    : "hover:bg-black/5"
                }`}
                key={p.value}
                onClick={() => void save(p.value)}
                type="button"
              >
                <span className={`block text-sm font-semibold ${policy === p.value ? "text-ink" : "text-ink-muted"}`}>
                  {p.label}
                </span>
              </button>
            ))}
          </div>

          {/* Coloured indicator bar */}
          <div className="mt-3 h-1 rounded-full bg-black/5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                policy === "open" ? "bg-emerald-400 w-1/3" :
                policy === "curated" ? "bg-amber-400 w-2/3" :
                "bg-red-400 w-full"
              }`}
            />
          </div>
        </div>

        {/* Active description */}
        <div className={`mt-4 rounded-2xl px-4 py-3 text-sm transition-colors ${
          policy === "open" ? "bg-emerald-50 text-emerald-800" :
          policy === "curated" ? "bg-amber-50 text-amber-800" :
          "bg-red-50 text-red-800"
        }`}>
          <p className="font-semibold">{current?.label}</p>
          <p className="mt-0.5 text-[13px] opacity-80">{current?.description}</p>
        </div>
      </div>

      {saving && <p className="mt-3 text-sm text-ink-muted">Saving…</p>}
      {!saving && message && <p className="mt-3 text-sm font-medium text-accent">{message}</p>}
    </article>
  );
}
