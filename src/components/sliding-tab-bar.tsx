"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Tab = {
  id: string;
  label: React.ReactNode;
  href: string;
};

type SlidingTabBarProps = {
  tabs: Tab[];
  activeId: string;
  className?: string;
};

export function SlidingTabBar({ tabs, activeId, className = "" }: SlidingTabBarProps) {
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const idx = tabs.findIndex((t) => t.id === activeId);
    const el = linkRefs.current[idx];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeId, tabs]);

  return (
    <div
      className={`relative flex gap-1 p-1 ${className}`}
      style={{ background: "rgba(255,255,255,.06)", borderRadius: "1rem" }}
    >
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
      {tabs.map((tab, idx) => (
        <Link
          className="relative whitespace-nowrap rounded-xl px-5 py-2 text-sm font-semibold transition-colors duration-150 active:scale-95"
          href={tab.href}
          key={tab.id}
          ref={(el) => { linkRefs.current[idx] = el; }}
          style={{ color: activeId === tab.id ? "rgba(255,255,255,.92)" : "rgba(255,255,255,.40)", background: "transparent" }}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
