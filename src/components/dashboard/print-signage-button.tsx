"use client";

export function PrintSignageButton() {
  return (
    <button
      className="no-print rounded-full bg-ink px-5 py-3 text-sm font-bold text-surface transition hover:bg-ink/90"
      onClick={() => window.print()}
      type="button"
    >
      Print signage
    </button>
  );
}
