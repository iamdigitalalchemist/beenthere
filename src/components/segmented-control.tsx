"use client";

import { useEffect, useRef, useState } from "react";

type Option<T extends string> = {
  id: T;
  label: React.ReactNode;
};

type SegmentedControlProps<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  containerStyle?: React.CSSProperties;
  className?: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  containerStyle,
  className = "",
}: SegmentedControlProps<T>) {
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const idx = options.findIndex((o) => o.id === value);
    const btn = btnRefs.current[idx];
    if (btn) setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
  }, [value, options]);

  return (
    <div
      className={`relative flex gap-1 p-1 ${className}`}
      style={{
        background: "rgba(255,255,255,.06)",
        borderRadius: "1rem",
        ...containerStyle,
      }}
    >
      {/* Sliding indicator */}
      {indicator.width > 0 && (
        <div
          className="pointer-events-none absolute top-1 rounded-xl"
          style={{
            left: indicator.left,
            width: indicator.width,
            height: "calc(100% - 8px)",
            background: "rgba(255,255,255,.14)",
            boxShadow: "0 1px 6px rgba(0,0,0,.20)",
            transition: "left 200ms cubic-bezier(0.34,1.56,0.64,1), width 150ms ease",
          }}
        />
      )}
      {options.map((option, idx) => (
        <button
          className="relative whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors duration-150 active:scale-95"
          key={option.id}
          onClick={() => onChange(option.id)}
          ref={(el) => { btnRefs.current[idx] = el; }}
          style={{ color: value === option.id ? "rgba(255,255,255,.92)" : "rgba(255,255,255,.40)", background: "transparent" }}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
