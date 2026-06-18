"use client";

import { useState } from "react";
import { formatGuestRecoveryCode } from "@/lib/guest-recovery";

type GuestRecoveryCodePanelProps = {
  code: string;
  compact?: boolean;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
};

export function GuestRecoveryCodePanel({
  code,
  compact = false,
  onRegenerate,
  isRegenerating = false,
}: GuestRecoveryCodePanelProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className={compact ? "px-4 py-3" : "px-4 py-4"}
      style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)", borderRadius: "16px" }}
    >
      <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,.80)" }}>Your guest code</p>
      <p className="mt-1 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,.40)" }}>
        Save this to return on another phone. It&apos;s like a password just for
        you in this gallery.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <p
          className="min-w-0 flex-1 rounded-2xl px-4 py-3 text-center font-mono text-2xl font-bold tracking-[0.35em]"
          style={{ background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.92)" }}
        >
          {formatGuestRecoveryCode(code)}
        </p>
        <button
          className="min-h-11 shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-white transition active:scale-[0.98]"
          onClick={() => { void handleCopy(); }}
          style={{ background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.16)" }}
          type="button"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      {onRegenerate ? (
        <button
          className="mt-3 text-sm font-semibold transition disabled:opacity-50"
          disabled={isRegenerating}
          onClick={onRegenerate}
          style={{
            background: "linear-gradient(135deg, #FF6AA9, #B65DFF)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
          type="button"
        >
          {isRegenerating ? "Creating new code..." : "Create a new guest code"}
        </button>
      ) : null}
    </div>
  );
}
