"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UploadPolicy } from "@/types/domain";

const POLICIES: { value: UploadPolicy; label: string; description: string }[] = [
  { value: "open",    label: "Open",    description: "All uploads are immediately visible and added to the gallery." },
  { value: "curated", label: "Curated", description: "Uploads are visible to everyone but you choose what goes in the gallery." },
  { value: "strict",  label: "Strict",  description: "All uploads are hidden until you review and approve each one." },
];

type Props = { eventPublicId: string; uploadPolicy: UploadPolicy };

export function UploadPolicySettings({ eventPublicId, uploadPolicy: initialPolicy }: Props) {
  const router = useRouter();
  const [policy, setPolicy] = useState<UploadPolicy>(initialPolicy);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const currentIndex = POLICIES.findIndex((p) => p.value === policy);
  const current = POLICIES[currentIndex];

  async function save(next: UploadPolicy) {
    if (next === policy || saving) return;
    const prev = policy;
    setPolicy(next);
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/events/${eventPublicId}/upload-policy`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadPolicy: next }),
    });
    setSaving(false);
    if (res.ok) { setMessage("Saved."); router.refresh(); }
    else { setPolicy(prev); setMessage("Could not save. Try again."); }
  }

  const barColor = policy === "open" ? "#56D892" : policy === "curated" ? "#FFBE55" : "#FF5F7B";
  const barWidth = policy === "open" ? "33.3%" : policy === "curated" ? "66.6%" : "100%";
  const descBg = policy === "open"
    ? "rgba(86,216,146,.08)"
    : policy === "curated"
      ? "rgba(255,190,85,.08)"
      : "rgba(255,95,123,.08)";
  const descBorder = policy === "open"
    ? "rgba(86,216,146,.15)"
    : policy === "curated"
      ? "rgba(255,190,85,.15)"
      : "rgba(255,95,123,.15)";
  const descColor = policy === "open" ? "#56D892" : policy === "curated" ? "#FFBE55" : "#FF8FA3";

  return (
    <article
      className="rounded-3xl p-6"
      style={{
        background: "rgba(255,255,255,.04)",
        border: "1px solid rgba(255,255,255,.08)",
        backdropFilter: "blur(18px)",
        boxShadow: "0 8px 32px rgba(0,0,0,.32)",
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,.30)", letterSpacing: "0.08em" }}>
        Upload moderation
      </p>
      <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,.45)" }}>
        Control how guest uploads are handled when they arrive.
      </p>

      <div className="mt-5">
        {/* Selector */}
        <div className="flex gap-1 rounded-2xl p-1" style={{ background: "rgba(255,255,255,.06)" }}>
          {POLICIES.map((p) => (
            <button
              className="flex-1 rounded-xl px-3 py-2.5 text-center transition active:scale-[0.98]"
              key={p.value}
              onClick={() => void save(p.value)}
              style={policy === p.value
                ? { background: "rgba(255,255,255,.10)", color: "rgba(255,255,255,.92)" }
                : { color: "rgba(255,255,255,.35)" }
              }
              type="button"
            >
              <span className="block text-sm font-semibold">{p.label}</span>
            </button>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.08)" }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: barWidth, background: barColor }}
          />
        </div>

        {/* Description */}
        <div
          className="mt-4 rounded-2xl px-4 py-3 text-sm transition-colors"
          style={{ background: descBg, border: `1px solid ${descBorder}` }}
        >
          <p className="font-semibold" style={{ color: descColor }}>{current?.label}</p>
          <p className="mt-0.5 text-[13px] opacity-80" style={{ color: descColor }}>{current?.description}</p>
        </div>
      </div>

      {saving && <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,.35)" }}>Saving…</p>}
      {!saving && message && (
        <p className="mt-3 text-sm font-medium" style={{
          background: "linear-gradient(135deg, #FF6AA9, #B65DFF)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          {message}
        </p>
      )}
    </article>
  );
}
