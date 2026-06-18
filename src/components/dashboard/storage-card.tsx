"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

type StorageCardProps = {
  eventId: string;
  initialUsedBytes: number;
  limitBytes: number;
};

export function StorageCard({ eventId, initialUsedBytes, limitBytes }: StorageCardProps) {
  const [usedBytes, setUsedBytes] = useState(initialUsedBytes);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`event-storage:${eventId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "beenthere", table: "events", filter: `id=eq.${eventId}` },
        (payload: { new: Record<string, unknown> }) => {
          const updated = payload.new as { storage_used_bytes?: number | string };
          if (updated.storage_used_bytes != null) {
            setUsedBytes(Number(updated.storage_used_bytes));
          }
        },
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [eventId]);

  const percent = Math.min(100, Math.round((usedBytes / limitBytes) * 100));

  return (
    <div
      className="rounded-3xl p-6 text-white"
      style={{
        background: "rgba(255,255,255,.04)",
        border: "1px solid rgba(255,255,255,.08)",
        backdropFilter: "blur(18px)",
        boxShadow: "0 0 40px rgba(165,112,255,.10), 0 8px 32px rgba(0,0,0,.32)",
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,.30)", letterSpacing: "0.08em" }}>Storage</p>
      <p className="mt-3 text-4xl font-bold" style={{ color: "rgba(255,255,255,.92)", letterSpacing: "-0.02em" }}>{percent}%</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,.08)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percent}%`,
            background: percent > 85
              ? "#FF5F7B"
              : "linear-gradient(90deg, #FF6DAE, #B35DFF)",
          }}
        />
      </div>
      <p className="mt-2 text-xs" style={{ color: "rgba(255,255,255,.30)" }}>
        {formatBytes(usedBytes)} of {formatBytes(limitBytes)}
      </p>
    </div>
  );
}
