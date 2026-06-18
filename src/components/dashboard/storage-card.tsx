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
    <div className="rounded-3xl bg-ink p-6 text-white shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Storage</p>
      <p className="mt-3 text-4xl font-bold">{percent}%</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ${percent > 85 ? "bg-red-400" : "bg-accent"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-white/40">
        {formatBytes(usedBytes)} of {formatBytes(limitBytes)}
      </p>
    </div>
  );
}
