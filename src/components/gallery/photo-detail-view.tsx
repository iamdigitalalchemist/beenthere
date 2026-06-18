"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DownloadIcon } from "@/components/gallery/download-icon";
import { HeartIcon } from "@/components/gallery/heart-icon";
import { ParticipantAvatar } from "@/components/gallery/participant-avatar";
import { ShareIcon } from "@/components/gallery/share-icon";
import {
  readStoredPhotoTags,
  writeStoredPhotoTags,
} from "@/lib/photo-tags-storage";
import { readJsonResponse } from "@/lib/read-json-response";
import type { PhotoRecord, PhotoTag } from "@/types/domain";

type GuestOption = {
  id: string;
  displayName: string;
  profilePhotoUrl?: string;
};

type PhotoDetailViewProps = {
  eventId: string;
  photos: PhotoRecord[];
  activeIndex: number;
  currentParticipantId?: string;
  getUploaderName: (photo: PhotoRecord) => string;
  isSaved: (photoId: string) => boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onRequireIdentity?: () => void;
  onToggleSave: (photoId: string) => void;
};

type PhotoTagsResponse = {
  tags?: PhotoTag[];
  likeCount?: number;
  error?: string;
};

type ParticipantsResponse = {
  participants?: GuestOption[];
  error?: string;
};

type SessionResponse = {
  participant?: { id: string } | null;
};

export function PhotoDetailView({
  eventId,
  photos,
  activeIndex,
  currentParticipantId,
  getUploaderName,
  isSaved,
  onClose,
  onNavigate,
  onRequireIdentity,
  onToggleSave,
}: PhotoDetailViewProps) {
  const photo = photos[activeIndex];
  const uploaderName = getUploaderName(photo);
  const [tags, setTags] = useState<PhotoTag[]>([]);
  const [likeCount, setLikeCount] = useState(0);
  const [guestOptions, setGuestOptions] = useState<GuestOption[]>([]);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [tagMessage, setTagMessage] = useState<string | null>(null);
  const [guestsLoading, setGuestsLoading] = useState(true);
  const [guestsError, setGuestsError] = useState<string | null>(null);
  const [taggingGuestId, setTaggingGuestId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showReportPanel, setShowReportPanel] = useState(false);
  const [swipeDx, setSwipeDx] = useState(0);
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);
  const touchStartX = useRef<number | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportStatus, setReportStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  const relatedPhotos = useMemo(
    () => photos.filter((item) => item.id !== photo.id).slice(0, 8),
    [photo.id, photos],
  );

  const taggedParticipantIds = useMemo(
    () => new Set(tags.map((tag) => tag.participantId)),
    [tags],
  );

  const availableGuests = useMemo(
    () =>
      guestOptions.filter(
        (guest) =>
          guest.id !== currentParticipantId &&
          !taggedParticipantIds.has(guest.id),
      ),
    [currentParticipantId, guestOptions, taggedParticipantIds],
  );

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      const storedTags = readStoredPhotoTags(photo.id);

      if (!cancelled && storedTags.length > 0) {
        setTags(storedTags);
      }
    });

    async function loadPhotoMeta() {
      try {
        const response = await fetch(`/api/photos/${photo.id}/tags`);
        const body = await readJsonResponse<PhotoTagsResponse>(response);

        if (cancelled || !response.ok || !body) {
          return;
        }

        setTags(body.tags ?? []);
        setLikeCount(body.likeCount ?? 0);
        writeStoredPhotoTags(photo.id, body.tags ?? []);
      } catch {
        // Keep local tag fallback.
      }
    }

    void loadPhotoMeta();

    return () => {
      cancelled = true;
    };
  }, [photo.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadGuests() {
      setGuestsLoading(true);
      setGuestsError(null);

      try {
        const response = await fetch(`/api/events/${eventId}/participants`);
        const body = await readJsonResponse<ParticipantsResponse>(response);

        if (cancelled) {
          return;
        }

        if (!response.ok || !body?.participants) {
          setGuestsError(
            body?.error ??
              (response.status === 401
                ? "Enter the event PIN to see guests."
                : "Could not load guests for this event."),
          );
          return;
        }

        setGuestOptions(body.participants);
      } catch {
        if (!cancelled) {
          setGuestsError("Could not load guests. Check your connection.");
        }
      } finally {
        if (!cancelled) {
          setGuestsLoading(false);
        }
      }
    }

    void loadGuests();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowLeft" && activeIndex > 0) {
        onNavigate(activeIndex - 1);
      } else if (event.key === "ArrowRight" && activeIndex < photos.length - 1) {
        onNavigate(activeIndex + 1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function saveTagsLocally(nextTags: PhotoTag[]) {
    setTags(nextTags);
    writeStoredPhotoTags(photo.id, nextTags);
    setShowTagPicker(false);
    setTagMessage(null);
  }

  async function ensureServerSession() {
    try {
      const response = await fetch(`/api/sessions/current?eventId=${eventId}`);
      const body = await readJsonResponse<SessionResponse>(response);

      return Boolean(body?.participant?.id);
    } catch {
      return false;
    }
  }

  async function toggleTag(guest: GuestOption) {
    if (!currentParticipantId) {
      setTagMessage("Add your guest details before tagging people.");
      onRequireIdentity?.();
      return;
    }

    const hasServerSession = await ensureServerSession();

    if (!hasServerSession) {
      setTagMessage(
        "Re-join as a guest to tag people — your name wasn't saved to this event.",
      );
      onRequireIdentity?.();
      return;
    }

    const isTagged = taggedParticipantIds.has(guest.id);
    setTaggingGuestId(guest.id);
    setTagMessage(null);

    try {
      const response = await fetch(`/api/photos/${photo.id}/tags`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: guest.id,
          displayName: guest.displayName,
          tagged: !isTagged,
        }),
      });
      const body = await readJsonResponse<PhotoTagsResponse>(response);

      if (response.ok && body?.tags) {
        saveTagsLocally(body.tags);
        return;
      }

      if (response.status === 401) {
        setTagMessage(
          body?.error ??
            "Join as a guest before tagging people in this photo.",
        );
        onRequireIdentity?.();
        return;
      }

      setTagMessage(
        body?.error ??
          (response.status === 404
            ? "This photo isn't saved yet, so tags can't be added."
            : "Could not update tags. Try again."),
      );
    } catch {
      setTagMessage("Could not update tags. Check your connection.");
    } finally {
      setTaggingGuestId(null);
    }
  }

  async function removeTag(participantId: string) {
    const hasServerSession = await ensureServerSession();

    if (!hasServerSession) {
      setTagMessage("Re-join as a guest to manage tags on this photo.");
      onRequireIdentity?.();
      return;
    }

    setTagMessage(null);

    try {
      const response = await fetch(`/api/photos/${photo.id}/tags`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          tagged: false,
        }),
      });
      const body = await readJsonResponse<PhotoTagsResponse>(response);

      if (response.ok && body?.tags) {
        saveTagsLocally(body.tags);
        return;
      }

      setTagMessage(body?.error ?? "Could not remove tag. Try again.");
    } catch {
      setTagMessage("Could not remove tag. Check your connection.");
    }
  }

  async function handleToggleSave() {
    const wasSaved = isSaved(photo.id);
    await onToggleSave(photo.id);
    setLikeCount((currentCount) =>
      wasSaved ? Math.max(0, currentCount - 1) : currentCount + 1,
    );
  }

  async function handleShare() {
    const imageUrl = photo.previewUrl || photo.thumbnailUrl;
    const shareText = `Photo by ${uploaderName}`;

    try {
      if (navigator.share) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const extension =
          photo.originalFileName.split(".").pop() ??
          blob.type.split("/")[1] ??
          "jpg";
        const file = new File(
          [blob],
          photo.originalFileName || `photo-${photo.id}.${extension}`,
          { type: blob.type || photo.originalContentType },
        );

        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: shareText,
            text: shareText,
          });
          return;
        }

        await navigator.share({
          title: shareText,
          text: shareText,
          url: window.location.href,
        });
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // User cancelled share or clipboard unavailable.
    }
  }

  async function handleDownload() {
    const imageUrl = photo.previewUrl || photo.thumbnailUrl;
    const fileName = photo.originalFileName || `photo-${photo.id}.jpg`;

    setIsDownloading(true);

    try {
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error("Download failed.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileName;
      anchor.rel = "noopener";
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      const anchor = document.createElement("a");
      anchor.href = imageUrl;
      anchor.download = fileName;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.click();
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleReport() {
    setReportStatus("sending");

    try {
      const response = await fetch(`/api/photos/${photo.id}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason.trim() || undefined }),
      });

      if (!response.ok) {
        setReportStatus("error");
        return;
      }

      setReportStatus("sent");
      window.setTimeout(() => {
        onClose();
      }, 1600);
    } catch {
      setReportStatus("error");
    }
  }

  return (
    <div
      aria-modal="true"
      className="photo-detail-overlay fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      style={{ background: "linear-gradient(180deg, #090918 0%, #10122C 100%)" }}
    >
      <div className="mx-auto min-h-full w-full max-w-lg px-4 pb-10 pt-4">
        <header
          className="sticky top-0 z-10 mb-4 flex items-center justify-between py-2"
          style={{ background: "rgba(9,9,24,.90)", backdropFilter: "blur(16px)" }}
        >
          <button
            aria-label="Back to gallery"
            className="tap-target flex size-11 items-center justify-center rounded-2xl text-lg transition active:scale-[0.98]"
            onClick={onClose}
            style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.10)", color: "rgba(255,255,255,.80)" }}
            type="button"
          >
            
          </button>
          <h2
            className="text-base font-semibold"
            style={{ color: "rgba(255,255,255,.80)", letterSpacing: "-0.01em" }}
          >
            Detail Photo
          </h2>
          <div className="size-11" />
        </header>

        <div className="flex items-center gap-3">
          <ParticipantAvatar name={uploaderName} size="md" />
          <p className="min-w-0 flex-1 text-sm" style={{ color: "rgba(255,255,255,.45)" }}>
            Photo by{" "}
            <span className="font-semibold" style={{ color: "rgba(255,255,255,.85)" }}>{uploaderName}</span>
          </p>
          <button
            aria-label="Share photo"
            className="flex size-11 items-center justify-center rounded-full transition active:scale-95"
            onClick={() => void handleShare()}
            style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.10)", color: "rgba(255,255,255,.70)" }}
            title="Share photo"
            type="button"
          >
            <ShareIcon className="size-5" />
          </button>
        </div>

        <div
          className="group relative mt-5 touch-pan-y select-none overflow-hidden rounded-[2rem]"
          onTouchCancel={() => { setSwipeDx(0); touchStartX.current = null; }}
          onTouchEnd={(e) => {
            const dx = swipeDx;
            setSwipeDx(0);
            touchStartX.current = null;
            if (dx < -50 && activeIndex < photos.length - 1) {
              setSlideDir("left");
              onNavigate(activeIndex + 1);
            } else if (dx > 50 && activeIndex > 0) {
              setSlideDir("right");
              onNavigate(activeIndex - 1);
            }
          }}
          onTouchMove={(e) => {
            if (touchStartX.current === null) return;
            const dx = e.touches[0].clientX - touchStartX.current;
            setSwipeDx(dx);
          }}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={`Photo by ${uploaderName}`}
            className={`aspect-[4/5] w-full bg-border object-cover shadow-soft ${
              slideDir === "left" ? "photo-slide-in-left" : slideDir === "right" ? "photo-slide-in-right" : "lightbox-photo-enter"
            }`}
            key={photo.id}
            onAnimationEnd={() => setSlideDir(null)}
            src={photo.previewUrl || photo.thumbnailUrl || undefined}
            style={{
              transform: swipeDx ? `translateX(${swipeDx * 0.4}px) rotate(${swipeDx * 0.01}deg)` : undefined,
              transition: swipeDx ? "none" : "transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94)",
            }}
          />
          {photos.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
              {photos.length <= 20 ? (
                <div className="flex gap-1.5">
                  {photos.map((_, i) => (
                    <button
                      aria-label={`Go to photo ${i + 1}`}
                      className={`rounded-full transition-all ${
                        i === activeIndex
                          ? "h-1.5 w-4 bg-white"
                          : "size-1.5 bg-white/50 hover:bg-white/80"
                      }`}
                      key={i}
                      onClick={() => onNavigate(i)}
                      type="button"
                    />
                  ))}
                </div>
              ) : (
                <span className="rounded-full bg-black/40 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  {activeIndex + 1} / {photos.length}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            className="tap-target inline-flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98]"
            onClick={() => void handleToggleSave()}
            style={isSaved(photo.id)
              ? { background: "rgba(255,109,174,.15)", border: "1px solid rgba(255,109,174,.25)", color: "#FF6DAE" }
              : { background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)", color: "rgba(255,255,255,.65)" }
            }
            type="button"
          >
            <HeartIcon
              className="size-4"
              filled={isSaved(photo.id)}
            />
            {likeCount} {likeCount === 1 ? "like" : "likes"}
          </button>
          <button
            className="tap-target inline-flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
            disabled={isDownloading}
            onClick={() => void handleDownload()}
            style={{ background: "linear-gradient(135deg, #FF6DAE, #B35DFF)", color: "white", boxShadow: "0 4px 16px rgba(205,95,255,.20)" }}
            type="button"
          >
            <DownloadIcon className="size-4" />
            {isDownloading ? "Downloading…" : "Download"}
          </button>
          <button
            className="tap-target ml-auto text-sm font-semibold underline-offset-2 transition hover:underline"
            onClick={() => setShowReportPanel((current) => !current)}
            style={{ color: "rgba(255,255,255,.30)" }}
            type="button"
          >
            Report
          </button>
        </div>

        {showReportPanel ? (
          <div
            className="mt-4 rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}
          >
            {reportStatus === "sent" ? (
              <p className="text-sm font-medium" style={{ color: "#56D892" }}>
                Thanks — the photo was reported and hidden until the host reviews it.
              </p>
            ) : (
              <>
                <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,.85)" }}>
                  Report this photo
                </p>
                <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,.40)" }}>
                  It will be hidden from the gallery until the host reviews it.
                </p>
                <textarea
                  className="mt-3 w-full rounded-xl p-3 text-sm outline-none transition"
                  maxLength={500}
                  onChange={(event) => setReportReason(event.target.value)}
                  placeholder="Why are you reporting this? (optional)"
                  rows={2}
                  style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)", color: "rgba(255,255,255,.80)" }}
                  value={reportReason}
                />
                {reportStatus === "error" ? (
                  <p className="mt-2 text-sm font-medium" style={{ color: "#FF8FA3" }}>
                    Could not send the report. Please try again.
                  </p>
                ) : null}
                <div className="mt-3 flex gap-2">
                  <button
                    className="rounded-full px-4 py-2 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
                    disabled={reportStatus === "sending"}
                    onClick={() => void handleReport()}
                    style={{ background: "#FF5F7B" }}
                    type="button"
                  >
                    {reportStatus === "sending" ? "Reporting…" : "Report photo"}
                  </button>
                  <button
                    className="rounded-full px-4 py-2 text-sm font-semibold transition"
                    onClick={() => setShowReportPanel(false)}
                    style={{ color: "rgba(255,255,255,.40)" }}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        ) : null}

        <section className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-semibold" style={{ color: "rgba(255,255,255,.85)", letterSpacing: "-0.01em" }}>Tagged</h3>
            <button
              className="rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95"
              onClick={() => setShowTagPicker((current) => !current)}
              style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.10)", color: "rgba(255,255,255,.70)" }}
              type="button"
            >
              Tag someone
            </button>
          </div>

          {tagMessage ? (
            <p className="mt-3 text-sm" style={{ color: "#56D892" }}>{tagMessage}</p>
          ) : null}

          {tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition"
                  key={tag.participantId}
                  onClick={() => void removeTag(tag.participantId)}
                  style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)", color: "rgba(255,255,255,.75)" }}
                  title="Remove tag"
                  type="button"
                >
                  <ParticipantAvatar name={tag.displayName} size="sm" />
                  {tag.displayName}
                  <span style={{ color: "rgba(255,255,255,.30)" }}>×</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm" style={{ color: "rgba(255,255,255,.35)" }}>
              No one tagged yet. Add guests who appear in this photo.
            </p>
          )}

          {showTagPicker ? (
            <div
              className="mt-4 rounded-[1.5rem] p-4"
              style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}
            >
              {!currentParticipantId ? (
                <div className="space-y-3">
                  <p className="text-sm" style={{ color: "rgba(255,255,255,.40)" }}>
                    Join as a guest to tag people in photos.
                  </p>
                  {onRequireIdentity ? (
                    <button
                      className="rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                      onClick={onRequireIdentity}
                      style={{ background: "linear-gradient(135deg, #FF6DAE, #B35DFF)" }}
                      type="button"
                    >
                      Add your name
                    </button>
                  ) : null}
                </div>
              ) : guestsLoading ? (
                <p className="text-sm" style={{ color: "rgba(255,255,255,.35)" }}>Loading guests…</p>
              ) : guestsError ? (
                <p className="text-sm" style={{ color: "#FF8FA3" }}>{guestsError}</p>
              ) : availableGuests.length === 0 ? (
                <p className="text-sm" style={{ color: "rgba(255,255,255,.35)" }}>
                  {guestOptions.length <= 1
                    ? "No other guests have joined yet. Friends need to scan the QR code and add their name first."
                    : "Everyone else from this event is already tagged."}
                </p>
              ) : (
                <ul className="space-y-1">
                  {availableGuests.map((guest) => (
                    <li key={guest.id}>
                      <button
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition hover:bg-white/5 disabled:opacity-60"
                        disabled={taggingGuestId === guest.id}
                        onClick={() => void toggleTag(guest)}
                        type="button"
                      >
                        <ParticipantAvatar name={guest.displayName} photoUrl={guest.profilePhotoUrl} size="sm" />
                        <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,.80)" }}>
                          {guest.displayName}
                        </span>
                        {taggingGuestId === guest.id ? (
                          <span className="ml-auto text-xs" style={{ color: "rgba(255,255,255,.35)" }}>
                            Saving…
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </section>

        {relatedPhotos.length > 0 ? (
          <section className="mt-10">
            <h3 className="text-xl font-semibold" style={{ color: "rgba(255,255,255,.85)", letterSpacing: "-0.01em" }}>Related</h3>
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {relatedPhotos.map((relatedPhoto) => {
                const relatedIndex = photos.findIndex((item) => item.id === relatedPhoto.id);
                return (
                  <button
                    className="w-36 shrink-0 overflow-hidden rounded-[1.5rem] transition"
                    key={relatedPhoto.id}
                    onClick={() => onNavigate(relatedIndex)}
                    style={{ border: "1px solid rgba(255,255,255,.08)" }}
                    type="button"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={`Related photo by ${getUploaderName(relatedPhoto)}`}
                      className="aspect-[4/5] w-full object-cover"
                      src={relatedPhoto.thumbnailUrl || undefined}
                    />
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
