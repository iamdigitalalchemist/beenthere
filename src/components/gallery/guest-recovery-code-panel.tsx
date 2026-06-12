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
      className={`rounded-2xl border border-accent/25 bg-accent-soft ${
        compact ? "px-4 py-3" : "px-4 py-4"
      }`}
    >
      <p className="text-sm font-semibold text-ink">Your guest code</p>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">
        Save this to return on another phone. It&apos;s like a password just for
        you in this gallery.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <p className="min-w-0 flex-1 rounded-2xl bg-surface px-4 py-3 text-center font-mono text-2xl font-bold tracking-[0.35em] text-ink">
          {formatGuestRecoveryCode(code)}
        </p>
        <button
          className="min-h-11 shrink-0 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:border-accent/30 active:scale-[0.98]"
          onClick={() => {
            void handleCopy();
          }}
          type="button"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {onRegenerate ? (
        <button
          className="mt-3 text-sm font-semibold text-accent transition hover:text-accent-hover disabled:opacity-50"
          disabled={isRegenerating}
          onClick={onRegenerate}
          type="button"
        >
          {isRegenerating ? "Creating new code..." : "Create a new guest code"}
        </button>
      ) : null}
    </div>
  );
}
