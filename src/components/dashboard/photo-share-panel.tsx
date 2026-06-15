"use client";

import { useEffect, useState } from "react";
import type { GuestSocialHandles } from "@/types/domain";

type TaggedGuest = {
  displayName: string;
  handles: GuestSocialHandles;
};

type ShareCaptionResponse = {
  tagged: TaggedGuest[];
  captions: Record<"instagram" | "facebook" | "x" | "tiktok", string>;
};

type PhotoSharePanelProps = {
  photoId: string;
  thumbnailUrl: string;
  originalFileName: string;
  onClose: () => void;
};

const PLATFORMS = [
  { key: "instagram" as const, label: "Instagram", prefix: "📸" },
  { key: "tiktok" as const, label: "TikTok", prefix: "🎵" },
  { key: "x" as const, label: "X (Twitter)", prefix: "🐦" },
  { key: "facebook" as const, label: "Facebook", prefix: "👥" },
];

export function PhotoSharePanel({
  photoId,
  thumbnailUrl,
  originalFileName,
  onClose,
}: PhotoSharePanelProps) {
  const [data, setData] = useState<ShareCaptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePlatform, setActivePlatform] = useState<"instagram" | "facebook" | "x" | "tiktok">("instagram");
  const [copied, setCopied] = useState(false);
  const [customCaption, setCustomCaption] = useState("");
  const [captionsReady, setCaptionsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/photos/${photoId}/share-caption`);
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as ShareCaptionResponse;
        if (!cancelled) {
          setData(json);
          setCustomCaption(json.captions[activePlatform] ?? "");
          setCaptionsReady(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoId]);

  function switchPlatform(platform: typeof activePlatform) {
    setActivePlatform(platform);
    if (data) {
      setCustomCaption(data.captions[platform] ?? "");
    }
    setCopied(false);
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(customCaption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  }

  async function downloadPhoto() {
    try {
      const res = await fetch(thumbnailUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = originalFileName || `photo-${photoId}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      const a = document.createElement("a");
      a.href = thumbnailUrl;
      a.download = originalFileName || `photo-${photoId}.jpg`;
      a.target = "_blank";
      a.click();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="relative w-full max-w-md rounded-t-[2rem] bg-white px-5 pb-8 pt-5 shadow-2xl ring-1 ring-black/5 sm:rounded-[2rem]">
        {/* Handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-black/15 sm:hidden" />

        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-ink">Share photo</h2>
            <p className="mt-0.5 text-sm text-ink-muted">
              Download the photo and copy the caption to post manually.
            </p>
          </div>
          <button
            className="rounded-full p-2 text-ink-muted transition hover:bg-black/5 hover:text-ink"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Thumbnail */}
        {thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt="Photo preview"
            className="mb-5 h-40 w-full rounded-2xl object-cover"
            src={thumbnailUrl}
          />
        )}

        {/* Platform tabs */}
        <div className="mb-4 flex gap-1 rounded-2xl bg-black/5 p-1">
          {PLATFORMS.map((p) => (
            <button
              className={`flex-1 rounded-xl px-2 py-2 text-xs font-semibold transition active:scale-95 ${
                activePlatform === p.key
                  ? "bg-white text-ink shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
              key={p.key}
              onClick={() => switchPlatform(p.key)}
              type="button"
            >
              {p.prefix} {p.label}
            </button>
          ))}
        </div>

        {/* Caption editor */}
        {loading ? (
          <div className="h-20 animate-pulse rounded-2xl bg-black/5" />
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
                Caption
              </p>
              {captionsReady && data && data.tagged.length === 0 && (
                <p className="text-xs text-ink-muted">No tagged guests with handles yet</p>
              )}
            </div>
            <textarea
              className="w-full rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              onChange={(e) => setCustomCaption(e.target.value)}
              placeholder="Add a caption…"
              rows={4}
              value={customCaption}
            />
            {data && data.tagged.length > 0 && (
              <p className="text-xs text-ink-muted">
                {data.tagged.length} tagged guest{data.tagged.length > 1 ? "s" : ""} — handles auto-filled where available
              </p>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 rounded-2xl bg-[#f8f9fb] px-4 py-3 text-xs text-ink-muted ring-1 ring-black/5">
          <p className="font-semibold text-ink">How to post</p>
          <ol className="mt-1.5 list-inside list-decimal space-y-1">
            <li>Download the photo below</li>
            <li>Copy the caption above</li>
            <li>Open {PLATFORMS.find((p) => p.key === activePlatform)?.label} and create a post</li>
            <li>Paste the caption — tagged handles will be clickable</li>
          </ol>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-col gap-2">
          <button
            className="min-h-11 w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/80 active:scale-[0.98]"
            onClick={() => void copyCaption()}
            type="button"
          >
            {copied ? "Copied!" : "Copy caption"}
          </button>
          <button
            className="min-h-11 w-full rounded-full border border-black/10 bg-black/5 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-black/10 active:scale-[0.98]"
            onClick={() => void downloadPhoto()}
            type="button"
          >
            Download photo
          </button>
        </div>
      </div>
    </div>
  );
}
