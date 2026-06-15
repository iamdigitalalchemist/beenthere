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
      className="photo-detail-overlay fixed inset-0 z-50 overflow-y-auto bg-canvas"
      role="dialog"
    >
      <div className="mx-auto min-h-full w-full max-w-lg px-4 pb-10 pt-4">
        <header className="sticky top-0 z-10 mb-4 flex items-center justify-between bg-canvas/95 py-2 backdrop-blur-md">
          <button
            aria-label="Back to gallery"
            className="tap-target flex size-11 items-center justify-center rounded-2xl bg-surface text-lg text-ink shadow-sm ring-1 ring-border transition hover:bg-accent-soft active:scale-[0.98]"
            onClick={onClose}
            type="button"
          >
            ←
          </button>
          <h2 className="text-lg font-semibold text-ink">Detail Photo</h2>
          <div className="size-11" />
        </header>

        <div className="flex items-center gap-3">
          <ParticipantAvatar name={uploaderName} size="md" />
          <p className="min-w-0 flex-1 text-sm text-ink-muted">
            Photo by{" "}
            <span className="font-semibold text-accent">{uploaderName}</span>
          </p>
          <button
            aria-label="Share photo"
            className="flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent transition hover:bg-accent/15"
            onClick={() => void handleShare()}
            title="Share photo"
            type="button"
          >
            <ShareIcon className="size-5" />
          </button>
        </div>

        <div
          className="relative mt-5 touch-pan-y select-none"
          onTouchCancel={() => { setSwipeDx(0); touchStartX.current = null; }}
          onTouchEnd={(e) => {
            const dx = swipeDx;
            setSwipeDx(0);
            touchStartX.current = null;
            if (dx < -50 && activeIndex < photos.length - 1) onNavigate(activeIndex + 1);
            else if (dx > 50 && activeIndex > 0) onNavigate(activeIndex - 1);
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
            className="lightbox-photo-enter aspect-[4/5] w-full rounded-[2rem] bg-border object-cover shadow-soft"
            key={photo.id}
            src={photo.previewUrl || photo.thumbnailUrl}
            style={{
              transform: swipeDx ? `translateX(${swipeDx * 0.35}px)` : undefined,
              transition: swipeDx ? "none" : "transform 0.2s ease",
            }}
          />
          {activeIndex > 0 && (
            <button
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 active:scale-95"
              onClick={() => onNavigate(activeIndex - 1)}
              type="button"
            >
              ‹
            </button>
          )}
          {activeIndex < photos.length - 1 && (
            <button
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 active:scale-95"
              onClick={() => onNavigate(activeIndex + 1)}
              type="button"
            >
              ›
            </button>
          )}
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
            className="tap-target inline-flex items-center gap-3 rounded-full bg-accent-soft px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-accent/15 active:scale-[0.98]"
            onClick={() => void handleToggleSave()}
            type="button"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-surface">
              <HeartIcon
                className={`size-4 ${isSaved(photo.id) ? "text-accent" : "text-ink-muted"}`}
                filled={isSaved(photo.id)}
              />
            </span>
            {likeCount} {likeCount === 1 ? "like" : "likes"}
          </button>
          <button
            className="tap-target inline-flex items-center gap-3 rounded-full bg-surface px-4 py-2.5 text-sm font-semibold text-ink ring-1 ring-border transition hover:bg-canvas active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
            disabled={isDownloading}
            onClick={() => void handleDownload()}
            type="button"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-accent text-surface">
              <DownloadIcon className="size-4" />
            </span>
            {isDownloading ? "Downloading…" : "Download"}
          </button>
          <button
            className="tap-target ml-auto text-sm font-semibold text-ink-muted underline-offset-2 transition hover:text-ink hover:underline"
            onClick={() => setShowReportPanel((current) => !current)}
            type="button"
          >
            Report
          </button>
        </div>

        {showReportPanel ? (
          <div className="mt-4 rounded-2xl bg-surface p-4 ring-1 ring-border">
            {reportStatus === "sent" ? (
              <p className="text-sm font-medium text-accent">
                Thanks — the photo was reported and hidden until the host
                reviews it.
              </p>
            ) : (
              <>
                <p className="text-sm font-semibold text-ink">
                  Report this photo
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  It will be hidden from the gallery until the host reviews
                  it.
                </p>
                <textarea
                  className="mt-3 w-full rounded-xl bg-canvas p-3 text-sm text-ink ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-accent"
                  maxLength={500}
                  onChange={(event) => setReportReason(event.target.value)}
                  placeholder="Why are you reporting this? (optional)"
                  rows={2}
                  value={reportReason}
                />
                {reportStatus === "error" ? (
                  <p className="mt-2 text-sm font-medium text-red-600">
                    Could not send the report. Please try again.
                  </p>
                ) : null}
                <div className="mt-3 flex gap-2">
                  <button
                    className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
                    disabled={reportStatus === "sending"}
                    onClick={() => void handleReport()}
                    type="button"
                  >
                    {reportStatus === "sending" ? "Reporting…" : "Report photo"}
                  </button>
                  <button
                    className="rounded-full px-4 py-2 text-sm font-semibold text-ink-muted transition hover:text-ink"
                    onClick={() => setShowReportPanel(false)}
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
            <h3 className="text-xl font-semibold text-ink">Tagged</h3>
            <button
              className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-surface transition hover:bg-ink/90"
              onClick={() => setShowTagPicker((current) => !current)}
              type="button"
            >
              Tag someone
            </button>
          </div>

          {tagMessage ? (
            <p className="mt-3 text-sm text-accent">{tagMessage}</p>
          ) : null}

          {tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-2 text-sm font-medium text-ink ring-1 ring-border transition hover:ring-accent/40"
                  key={tag.participantId}
                  onClick={() => void removeTag(tag.participantId)}
                  title="Remove tag"
                  type="button"
                >
                  <ParticipantAvatar
                    name={tag.displayName}
                    size="sm"
                  />
                  {tag.displayName}
                  <span className="text-ink-muted">×</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-muted">
              No one tagged yet. Add guests who appear in this photo.
            </p>
          )}

          {showTagPicker ? (
            <div className="mt-4 rounded-[1.5rem] bg-surface p-4 ring-1 ring-border">
              {!currentParticipantId ? (
                <div className="space-y-3">
                  <p className="text-sm text-ink-muted">
                    Join as a guest to tag people in photos.
                  </p>
                  {onRequireIdentity ? (
                    <button
                      className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-surface transition hover:bg-accent/90"
                      onClick={onRequireIdentity}
                      type="button"
                    >
                      Add your name
                    </button>
                  ) : null}
                </div>
              ) : guestsLoading ? (
                <p className="text-sm text-ink-muted">Loading guests…</p>
              ) : guestsError ? (
                <p className="text-sm text-accent">{guestsError}</p>
              ) : availableGuests.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  {guestOptions.length <= 1
                    ? "No other guests have joined yet. Friends need to scan the QR code and add their name first."
                    : "Everyone else from this event is already tagged."}
                </p>
              ) : (
                <ul className="space-y-2">
                  {availableGuests.map((guest) => (
                    <li key={guest.id}>
                      <button
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition hover:bg-canvas disabled:opacity-60"
                        disabled={taggingGuestId === guest.id}
                        onClick={() => void toggleTag(guest)}
                        type="button"
                      >
                        <ParticipantAvatar
                          name={guest.displayName}
                          photoUrl={guest.profilePhotoUrl}
                          size="sm"
                        />
                        <span className="text-sm font-medium text-ink">
                          {guest.displayName}
                        </span>
                        {taggingGuestId === guest.id ? (
                          <span className="ml-auto text-xs text-ink-muted">
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
            <h3 className="text-xl font-semibold text-ink">Related Photo</h3>
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {relatedPhotos.map((relatedPhoto) => {
                const relatedIndex = photos.findIndex(
                  (item) => item.id === relatedPhoto.id,
                );

                return (
                  <button
                    className="w-36 shrink-0 overflow-hidden rounded-[1.5rem] bg-surface ring-1 ring-border transition hover:ring-accent/40"
                    key={relatedPhoto.id}
                    onClick={() => onNavigate(relatedIndex)}
                    type="button"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={`Related photo by ${getUploaderName(relatedPhoto)}`}
                      className="aspect-[4/5] w-full object-cover"
                      src={relatedPhoto.thumbnailUrl}
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
