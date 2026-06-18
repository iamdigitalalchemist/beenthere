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

  const glass: React.CSSProperties = {
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(255,255,255,.08)",
    backdropFilter: "blur(18px)",
  };

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.10)",
    color: "rgba(255,255,255,.85)",
    borderRadius: "16px",
    padding: "12px 16px",
    fontSize: "14px",
    outline: "none",
    width: "100%",
    resize: "vertical" as const,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" style={{ background: "rgba(0,0,0,.60)", backdropFilter: "blur(8px)" }}>
      <div
        className="relative w-full max-w-md rounded-t-[2rem] px-5 pb-8 pt-5 shadow-2xl sm:rounded-[2rem]"
        style={{ background: "rgba(15,16,35,.96)", border: "1px solid rgba(255,255,255,.08)", backdropFilter: "blur(24px)" }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full sm:hidden" style={{ background: "rgba(255,255,255,.15)" }} />

        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "rgba(255,255,255,.92)" }}>Share photo</h2>
            <p className="mt-0.5 text-sm" style={{ color: "rgba(255,255,255,.45)" }}>
              Download the photo and copy the caption to post manually.
            </p>
          </div>
          <button
            className="rounded-full p-2 transition active:scale-95"
            onClick={onClose}
            style={{ color: "rgba(255,255,255,.40)" }}
            type="button"
          >
            ✕
          </button>
        </div>

        {thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="Photo preview" className="mb-5 h-40 w-full rounded-2xl object-cover" src={thumbnailUrl} />
        )}

        {/* Platform tabs */}
        <div className="mb-4 flex gap-1 rounded-2xl p-1" style={{ background: "rgba(255,255,255,.06)" }}>
          {PLATFORMS.map((p) => (
            <button
              className="flex-1 rounded-xl px-2 py-2 text-xs font-semibold transition active:scale-95"
              key={p.key}
              onClick={() => switchPlatform(p.key)}
              style={activePlatform === p.key
                ? { background: "rgba(255,255,255,.14)", color: "rgba(255,255,255,.92)" }
                : { color: "rgba(255,255,255,.40)" }
              }
              type="button"
            >
              {p.prefix} {p.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="h-20 animate-pulse rounded-2xl" style={{ background: "rgba(255,255,255,.06)" }} />
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,.30)", letterSpacing: "0.08em" }}>Caption</p>
              {captionsReady && data && data.tagged.length === 0 && (
                <p className="text-xs" style={{ color: "rgba(255,255,255,.30)" }}>No tagged guests with handles yet</p>
              )}
            </div>
            <textarea
              onChange={(e) => setCustomCaption(e.target.value)}
              placeholder="Add a caption…"
              rows={4}
              style={inputStyle}
              value={customCaption}
            />
            {data && data.tagged.length > 0 && (
              <p className="text-xs" style={{ color: "rgba(255,255,255,.35)" }}>
                {data.tagged.length} tagged guest{data.tagged.length > 1 ? "s" : ""} — handles auto-filled where available
              </p>
            )}
          </div>
        )}

        <div className="mt-4 rounded-2xl px-4 py-3 text-xs" style={{ ...glass, color: "rgba(255,255,255,.45)" }}>
          <p className="font-semibold" style={{ color: "rgba(255,255,255,.80)" }}>How to post</p>
          <ol className="mt-1.5 list-inside list-decimal space-y-1">
            <li>Download the photo below</li>
            <li>Copy the caption above</li>
            <li>Open {PLATFORMS.find((p) => p.key === activePlatform)?.label} and create a post</li>
            <li>Paste the caption — tagged handles will be clickable</li>
          </ol>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <button
            className="min-h-11 w-full rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98]"
            onClick={() => void copyCaption()}
            style={{ background: "linear-gradient(135deg, #FF6DAE, #B35DFF)", boxShadow: "0 8px 24px rgba(205,95,255,.25)" }}
            type="button"
          >
            {copied ? "Copied!" : "Copy caption"}
          </button>
          <button
            className="min-h-11 w-full rounded-full px-5 py-3 text-sm font-semibold transition active:scale-[0.98]"
            onClick={() => void downloadPhoto()}
            style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)", color: "rgba(255,255,255,.70)" }}
            type="button"
          >
            Download photo
          </button>
        </div>
      </div>
    </div>
  );
}
