"use client";

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
  return (
    <div
      aria-label="Display size"
      className="flex gap-0.5 rounded-xl p-0.5"
      role="group"
      style={{ background: "rgba(255,255,255,.06)" }}
    >
      {SIZES.map((size) => (
        <button
          aria-label={size.label}
          aria-pressed={value === size.id}
          className="flex size-8 items-center justify-center rounded-lg transition active:scale-95"
          key={size.id}
          onClick={() => onChange(size.id)}
          style={value === size.id
            ? { background: "rgba(255,255,255,.14)", color: "rgba(255,255,255,.92)" }
            : { color: "rgba(255,255,255,.35)" }
          }
          title={size.label}
          type="button"
        >
          {size.icon}
        </button>
      ))}
    </div>
  );
}
