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
      <svg fill="currentColor" viewBox="0 0 16 16" width="14" height="14">
        <rect x="1" y="1" width="4" height="4" rx="0.75" />
        <rect x="6" y="1" width="4" height="4" rx="0.75" />
        <rect x="11" y="1" width="4" height="4" rx="0.75" />
        <rect x="1" y="6" width="4" height="4" rx="0.75" />
        <rect x="6" y="6" width="4" height="4" rx="0.75" />
        <rect x="11" y="6" width="4" height="4" rx="0.75" />
        <rect x="1" y="11" width="4" height="4" rx="0.75" />
        <rect x="6" y="11" width="4" height="4" rx="0.75" />
        <rect x="11" y="11" width="4" height="4" rx="0.75" />
      </svg>
    ),
  },
  {
    id: "medium",
    label: "Medium",
    icon: (
      <svg fill="currentColor" viewBox="0 0 16 16" width="14" height="14">
        <rect x="1" y="1" width="6.5" height="6.5" rx="1" />
        <rect x="8.5" y="1" width="6.5" height="6.5" rx="1" />
        <rect x="1" y="8.5" width="6.5" height="6.5" rx="1" />
        <rect x="8.5" y="8.5" width="6.5" height="6.5" rx="1" />
      </svg>
    ),
  },
  {
    id: "large",
    label: "Large",
    icon: (
      <svg fill="currentColor" viewBox="0 0 16 16" width="14" height="14">
        <rect x="1" y="1" width="14" height="6.5" rx="1.5" />
        <rect x="1" y="8.5" width="14" height="6.5" rx="1.5" />
      </svg>
    ),
  },
];

export function ViewSizeToggle({ value, onChange }: ViewSizeToggleProps) {
  return (
    <div className="flex gap-0.5 rounded-xl bg-black/5 p-0.5" role="group" aria-label="Display size">
      {SIZES.map((size) => (
        <button
          aria-label={size.label}
          aria-pressed={value === size.id}
          className={`flex size-8 items-center justify-center rounded-lg transition active:scale-95 ${
            value === size.id
              ? "bg-white text-ink shadow-sm"
              : "text-ink-muted hover:text-ink"
          }`}
          key={size.id}
          onClick={() => onChange(size.id)}
          title={size.label}
          type="button"
        >
          {size.icon}
        </button>
      ))}
    </div>
  );
}
