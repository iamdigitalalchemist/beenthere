"use client";

import { useEffect, useRef, useState } from "react";

export type ViewSize = "compact" | "medium" | "large";

type ViewSizeToggleProps = {
  value: ViewSize;
  onChange: (size: ViewSize) => void;
};

const SIZES: Array<{ id: ViewSize; label: string; icon: React.ReactNode }> = [
  {
    id: "compact",
    label: "Compact",
    icon: (
      <svg fill="currentColor" height="14" viewBox="0 0 16 16" width="14">
        <rect height="4" rx="0.75" width="4" x="1" y="1" /><rect height="4" rx="0.75" width="4" x="6" y="1" /><rect height="4" rx="0.75" width="4" x="11" y="1" />
        <rect height="4" rx="0.75" width="4" x="1" y="6" /><rect height="4" rx="0.75" width="4" x="6" y="6" /><rect height="4" rx="0.75" width="4" x="11" y="6" />
        <rect height="4" rx="0.75" width="4" x="1" y="11" /><rect height="4" rx="0.75" width="4" x="6" y="11" /><rect height="4" rx="0.75" width="4" x="11" y="11" />
      </svg>
    ),
  },
  {
    id: "medium",
    label: "Medium",
    icon: (
      <svg fill="currentColor" height="14" viewBox="0 0 16 16" width="14">
        <rect height="6.5" rx="1" width="6.5" x="1" y="1" /><rect height="6.5" rx="1" width="6.5" x="8.5" y="1" />
        <rect height="6.5" rx="1" width="6.5" x="1" y="8.5" /><rect height="6.5" rx="1" width="6.5" x="8.5" y="8.5" />
      </svg>
    ),
  },
  {
    id: "large",
    label: "Large",
    icon: (
      <svg fill="currentColor" height="14" viewBox="0 0 16 16" width="14">
        <rect height="6.5" rx="1.5" width="14" x="1" y="1" /><rect height="6.5" rx="1.5" width="14" x="1" y="8.5" />
      </svg>
    ),
  },
];

export function ViewSizeToggle({ value, onChange }: ViewSizeToggleProps) {
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const idx = SIZES.findIndex((s) => s.id === value);
    const btn = btnRefs.current[idx];
    if (btn) setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
  }, [value]);

  return (
    <div
      aria-label="Display size"
      className="relative flex gap-0.5 rounded-xl p-0.5"
      role="group"
      style={{ background: "rgba(255,255,255,.06)" }}
    >
      {indicator.width > 0 && (
        <div
          className="pointer-events-none absolute top-0.5 rounded-lg"
          style={{
            left: indicator.left,
            width: indicator.width,
            height: "calc(100% - 4px)",
            background: "rgba(255,255,255,.14)",
            boxShadow: "0 1px 6px rgba(0,0,0,.20)",
            transition: "left 200ms cubic-bezier(0.34,1.56,0.64,1), width 150ms ease",
          }}
        />
      )}
      {SIZES.map((size, idx) => (
        <button
          aria-label={size.label}
          aria-pressed={value === size.id}
          className="relative flex size-8 items-center justify-center rounded-lg transition-colors duration-150 active:scale-95"
          key={size.id}
          onClick={() => onChange(size.id)}
          ref={(el) => { btnRefs.current[idx] = el; }}
          style={{ color: value === size.id ? "rgba(255,255,255,.92)" : "rgba(255,255,255,.35)", background: "transparent" }}
          title={size.label}
          type="button"
        >
          {size.icon}
        </button>
      ))}
    </div>
  );
}
