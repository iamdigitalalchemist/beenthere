"use client";

import { useEffect, useMemo, useState } from "react";
import { PhotoSharePanel } from "@/components/dashboard/photo-share-panel";
import { PhotoDetailView } from "@/components/gallery/photo-detail-view";
import { ViewSizeToggle, type ViewSize } from "@/components/view-size-toggle";
import type {
  CustomAlbum,
  PhotoRecord,
  PhotoReportSummary,
  PhotoVisibility,
} from "@/types/domain";

type ModerationGridProps = {
  initialPhotos: PhotoRecord[];
  uploaderNames: Record<string, string>;
  reports?: Record<string, PhotoReportSummary>;
  // Optional: pass these to enable "Add to album" per photo
  customAlbums?: CustomAlbum[];
  eventPublicId?: string;
};

type VisibilityFilter = "all" | "visible" | "hidden" | "reported" | "processing";
type ModerationAction = Extract<PhotoVisibility, "visible" | "hidden" | "deleted">;

const badgeStyles: Record<string, string> = {
  visible: "bg-emerald-100 text-emerald-800",
  hidden: "bg-amber-100 text-amber-800",
  reported: "bg-red-100 text-red-800",
  pending_review: "bg-amber-100 text-amber-800",
};

// ─── Add-to-album sheet ──────────────────────────────────────────────────────

function AddToAlbumSheet({
  photoId,
  eventPublicId,
  customAlbums,
  onClose,
}: {
  photoId: string;
  eventPublicId: string;
  customAlbums: CustomAlbum[];
  onClose: () => void;
}) {
  const [saving, setSaving] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [albums, setAlbums] = useState(customAlbums);

  async function toggleAlbum(albumId: string, currentlyAdded: boolean) {
    setSaving(albumId);
    const res = await fetch(`/api/events/${eventPublicId}/albums/${albumId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId, add: !currentlyAdded }),
    });
    setSaving(null);
    if (res.ok) {
      setAdded((prev) => {
        const next = new Set(prev);
        currentlyAdded ? next.delete(albumId) : next.add(albumId);
        return next;
      });
    }
  }

  async function createAndAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setSaving("__new__");

    const res = await fetch(`/api/events/${eventPublicId}/albums`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });

    if (!res.ok) { setSaving(null); return; }
    const data = (await res.json()) as { id: string; name: string };

    await fetch(`/api/events/${eventPublicId}/albums/${data.id}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId, add: true }),
    });

    setSaving(null);
    setAlbums((prev) => [{ id: data.id, name: data.name, photoCount: 1, coverThumbnailUrl: "", createdAt: new Date().toISOString() }, ...prev]);
    setAdded((prev) => new Set([...prev, data.id]));
    setNewName("");
    setCreating(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full max-w-sm rounded-t-[2rem] bg-white px-5 pb-8 pt-5 shadow-2xl ring-1 ring-black/5 sm:rounded-[2rem]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-black/15 sm:hidden" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Add to album</h2>
          <button
            className="rounded-full p-2 text-ink-muted transition hover:bg-black/5 hover:text-ink"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        {albums.length === 0 && !creating ? (
          <p className="mb-4 text-sm text-ink-muted">No albums yet. Create one below.</p>
        ) : (
          <ul className="mb-3 max-h-56 space-y-1.5 overflow-y-auto">
            {albums.map((album) => {
              const isAdded = added.has(album.id);
              return (
                <li key={album.id}>
                  <button
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition active:scale-[0.99] ${
                      isAdded ? "bg-accent/10 ring-1 ring-accent/30" : "bg-black/5 hover:bg-black/8"
                    }`}
                    disabled={saving === album.id}
                    onClick={() => void toggleAlbum(album.id, isAdded)}
                    type="button"
                  >
                    <span className="text-lg">{isAdded ? "✅" : "📁"}</span>
                    <span className="flex-1 truncate text-sm font-semibold text-ink">{album.name}</span>
                    {saving === album.id && (
                      <span className="text-xs text-ink-muted">Saving…</span>
                    )}
                    {isAdded && saving !== album.id && (
                      <span className="text-xs font-semibold text-accent">Added</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {creating ? (
          <div className="space-y-2">
            <input
              autoFocus
              className="w-full rounded-2xl border border-black/10 bg-black/5 px-4 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void createAndAdd(); if (e.key === "Escape") setCreating(false); }}
              placeholder="Album name…"
              value={newName}
            />
            <div className="flex gap-2">
              <button
                className="flex-1 rounded-full bg-ink px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink/80 active:scale-95 disabled:opacity-50"
                disabled={!newName.trim() || saving === "__new__"}
                onClick={() => void createAndAdd()}
                type="button"
              >
                {saving === "__new__" ? "Creating…" : "Create & add"}
              </button>
              <button
                className="rounded-full border border-black/10 px-3 py-2 text-sm font-semibold text-ink transition hover:bg-black/5 active:scale-95"
                onClick={() => setCreating(false)}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="mt-1 w-full rounded-full border border-dashed border-black/20 py-2.5 text-sm font-semibold text-ink-muted transition hover:border-accent/40 hover:text-accent active:scale-[0.98]"
            onClick={() => setCreating(true)}
            type="button"
          >
            + New album
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main grid ───────────────────────────────────────────────────────────────

export function ModerationGrid({
  initialPhotos,
  uploaderNames,
  reports = {},
  customAlbums,
  eventPublicId,
}: ModerationGridProps) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [photoReports, setPhotoReports] = useState(reports);
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
  const [uploaderFilter, setUploaderFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [message, setMessage] = useState("Moderate photos before the slideshow.");
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [sharingPhotoId, setSharingPhotoId] = useState<string | null>(null);
  const [addToAlbumPhotoId, setAddToAlbumPhotoId] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [viewSize, setViewSize] = useState<ViewSize>("medium");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("bt:moderation-view-size") as ViewSize | null;
      if (stored === "compact" || stored === "medium" || stored === "large") setViewSize(stored);
    } catch { /* ignore */ }
  }, []);

  function changeViewSize(size: ViewSize) {
    setViewSize(size);
    try { window.localStorage.setItem("bt:moderation-view-size", size); } catch { /* ignore */ }
  }

  const reportedCount = useMemo(
    () => photos.filter((p) => p.visibility === "reported").length,
    [photos],
  );

  // Unique uploaders for filter dropdown
  const uploaderOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const photo of photos) {
      if (!seen.has(photo.participantId)) {
        seen.set(photo.participantId, uploaderNames[photo.participantId] ?? "Guest");
      }
    }
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [photos, uploaderNames]);

  // Unique dates for filter dropdown
  const dateOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const photo of photos) {
      seen.add((photo.takenAt ?? photo.uploadedAt).slice(0, 10));
    }
    return Array.from(seen).sort();
  }, [photos]);

  const filteredPhotos = useMemo(() => {
    return photos.filter((photo) => {
      if (visibilityFilter === "processing") return photo.status !== "ready";
      if (visibilityFilter === "visible" || visibilityFilter === "hidden" || visibilityFilter === "reported") {
        if (photo.visibility !== visibilityFilter) return false;
      }
      if (uploaderFilter !== "all" && photo.participantId !== uploaderFilter) return false;
      if (dateFilter !== "all" && (photo.takenAt ?? photo.uploadedAt).slice(0, 10) !== dateFilter) return false;
      return true;
    });
  }, [visibilityFilter, uploaderFilter, dateFilter, photos]);

  const activeFilterCount = (uploaderFilter !== "all" ? 1 : 0) + (dateFilter !== "all" ? 1 : 0);

  async function updateVisibility(photoId: string, visibility: ModerationAction) {
    const previousPhotos = photos;
    const previousReports = photoReports;

    setConfirmingDeleteId(null);
    setPhotoReports((current) => {
      const next = { ...current };
      delete next[photoId];
      return next;
    });
    setPhotos((currentPhotos) =>
      visibility === "deleted"
        ? currentPhotos.filter((p) => p.id !== photoId)
        : currentPhotos.map((p) => p.id === photoId ? { ...p, visibility } : p),
    );

    const response = await fetch(`/api/photos/${photoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility }),
    });

    if (!response.ok) {
      setPhotos(previousPhotos);
      setPhotoReports(previousReports);
      setMessage("Could not update that photo. Refresh and try again.");
      return;
    }

    setMessage(
      visibility === "deleted"
        ? "Photo deleted."
        : visibility === "hidden"
          ? "Photo hidden from gallery and slideshow."
          : "Photo is visible again.",
    );
  }

  function clearFilters() {
    setUploaderFilter("all");
    setDateFilter("all");
    setVisibilityFilter("all");
  }

  return (
    <section>
      {/* ── Advanced filter bar ── */}
      <div className="mb-5 space-y-3">
        {/* Dropdowns row */}
        <div className="flex flex-wrap gap-2">
          {uploaderOptions.length > 1 && (
            <select
              className={`rounded-2xl border px-4 py-2 text-sm font-semibold text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 ${
                uploaderFilter !== "all"
                  ? "border-accent bg-accent/5 text-accent"
                  : "border-black/10 bg-white"
              }`}
              onChange={(e) => setUploaderFilter(e.target.value)}
              value={uploaderFilter}
            >
              <option value="all">All guests</option>
              {uploaderOptions.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          )}

          {dateOptions.length > 1 && (
            <select
              className={`rounded-2xl border px-4 py-2 text-sm font-semibold text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 ${
                dateFilter !== "all"
                  ? "border-accent bg-accent/5 text-accent"
                  : "border-black/10 bg-white"
              }`}
              onChange={(e) => setDateFilter(e.target.value)}
              value={dateFilter}
            >
              <option value="all">All dates</option>
              {dateOptions.map((d) => (
                <option key={d} value={d}>
                  {new Date(d + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </option>
              ))}
            </select>
          )}

          {activeFilterCount > 0 && (
            <button
              className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-ink-muted transition hover:text-red-500 active:scale-95"
              onClick={clearFilters}
              type="button"
            >
              Clear filters ×
            </button>
          )}
        </div>

        {/* Visibility pills + size toggle row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-muted">
            {message}
            {activeFilterCount > 0 && (
              <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                {filteredPhotos.length} shown
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
          <ViewSizeToggle onChange={changeViewSize} value={viewSize} />
          <div className="flex gap-1 rounded-2xl bg-black/5 p-1 sm:w-fit">
            {(["all", "visible", "hidden", "reported", "processing"] as VisibilityFilter[]).map((f) => (
              <button
                className={`rounded-xl px-4 py-1.5 text-sm font-semibold capitalize transition active:scale-95 ${
                  visibilityFilter === f
                    ? "bg-white text-ink shadow-sm"
                    : "text-ink-muted hover:text-ink"
                }`}
                key={f}
                onClick={() => setVisibilityFilter(f)}
                type="button"
              >
                {f}
                {f === "reported" && reportedCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {reportedCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          </div>
        </div>
      </div>

      {/* ── Photo grid ── */}
      <div className={`grid gap-3 ${
        viewSize === "compact" ? "grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5" :
        viewSize === "large"   ? "grid-cols-1 sm:grid-cols-2" :
                                 "sm:grid-cols-2 lg:grid-cols-3"
      }`}>
        {filteredPhotos.map((photo) => {
          const uploaderName = uploaderNames[photo.participantId] ?? "Guest";
          const report = photoReports[photo.id];
          const isReported = photo.visibility === "reported";

          return (
            <article
              className={`overflow-hidden bg-white shadow-sm ring-1 transition ${
                isReported ? "ring-red-200" : "ring-black/5"
              } ${viewSize === "compact" ? "rounded-2xl" : "rounded-3xl"}`}
              key={photo.id}
            >
              <button
                className="block w-full cursor-zoom-in"
                onClick={() => setLightboxIndex(filteredPhotos.indexOf(photo))}
                title="View photo"
                type="button"
              >
                <div className={`bg-black/5 ${viewSize === "compact" ? "aspect-square" : "aspect-[4/3]"}`}>
                  {photo.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={`Uploaded by ${uploaderName}`}
                      className="h-full w-full object-cover transition hover:opacity-90"
                      src={photo.thumbnailUrl}
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-ink-muted">Processing…</div>
                  )}
                </div>
              </button>

              {viewSize === "compact" ? null : <div className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{uploaderName}</p>
                    <p className="text-[11px] text-ink-muted capitalize">
                      {(photo.takenAt ?? photo.uploadedAt).slice(0, 10)} · {photo.status}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${badgeStyles[photo.visibility] ?? badgeStyles.visible}`}>
                    {photo.visibility}
                  </span>
                </div>

                {report && (
                  <div className="rounded-2xl bg-red-50 px-3 py-2.5 text-xs text-red-800">
                    <p className="font-bold">{report.count} {report.count === 1 ? "report" : "reports"}</p>
                    {report.reasons.length > 0 && (
                      <ul className="mt-1 list-inside list-disc space-y-0.5 text-red-700">
                        {report.reasons.slice(0, 3).map((reason, i) => <li key={i}>{reason}</li>)}
                      </ul>
                    )}
                  </div>
                )}

                {confirmingDeleteId === photo.id ? (
                  <div className="flex gap-2">
                    <button
                      className="flex-1 rounded-full bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-600 active:scale-95"
                      onClick={() => void updateVisibility(photo.id, "deleted")}
                      type="button"
                    >
                      Confirm delete
                    </button>
                    <button
                      className="flex-1 rounded-full border border-black/10 bg-black/5 px-3 py-2 text-sm font-semibold text-ink transition hover:bg-black/10 active:scale-95"
                      onClick={() => setConfirmingDeleteId(null)}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {photo.visibility === "visible" ? (
                      <button
                        className="flex-1 rounded-full bg-ink px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink/80 active:scale-95"
                        onClick={() => void updateVisibility(photo.id, "hidden")}
                        type="button"
                      >
                        Hide
                      </button>
                    ) : (
                      <button
                        className="flex-1 rounded-full bg-ink px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink/80 active:scale-95"
                        onClick={() => void updateVisibility(photo.id, "visible")}
                        type="button"
                      >
                        {isReported ? "Approve" : "Unhide"}
                      </button>
                    )}
                    {isReported && (
                      <button
                        className="flex-1 rounded-full border border-black/10 bg-black/5 px-3 py-2 text-sm font-semibold text-ink transition hover:bg-black/10 active:scale-95"
                        onClick={() => void updateVisibility(photo.id, "hidden")}
                        type="button"
                      >
                        Hide
                      </button>
                    )}
                    <button
                      className="rounded-full border border-red-100 px-3 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50 active:scale-95"
                      onClick={() => setConfirmingDeleteId(photo.id)}
                      type="button"
                    >
                      Delete
                    </button>
                    {customAlbums && eventPublicId && (
                      <button
                        className="rounded-full border border-black/10 bg-black/5 px-3 py-2 text-sm font-semibold text-ink transition hover:bg-black/10 active:scale-95"
                        onClick={() => setAddToAlbumPhotoId(photo.id)}
                        title="Add to album"
                        type="button"
                      >
                        + Album
                      </button>
                    )}
                    <button
                      className="rounded-full border border-black/10 bg-black/5 px-3 py-2 text-sm font-semibold text-ink transition hover:bg-black/10 active:scale-95"
                      onClick={() => setSharingPhotoId(photo.id)}
                      title="Share with caption"
                      type="button"
                    >
                      Share ↗
                    </button>
                  </div>
                )}
              </div>}
            </article>
          );
        })}
      </div>

      {filteredPhotos.length === 0 && (
        <div className="mt-8 rounded-3xl border-2 border-dashed border-black/10 bg-white p-12 text-center">
          <p className="font-semibold text-ink">No photos match</p>
          <p className="mt-1 text-sm text-ink-muted">
            {activeFilterCount > 0 || visibilityFilter !== "all"
              ? "Try clearing the filters above."
              : "No photos in this view yet."}
          </p>
          {(activeFilterCount > 0 || visibilityFilter !== "all") && (
            <button
              className="mt-3 rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-black/5 active:scale-95"
              onClick={clearFilters}
              type="button"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {lightboxIndex !== null && filteredPhotos[lightboxIndex] && (
        <PhotoDetailView
          activeIndex={lightboxIndex}
          eventId={filteredPhotos[lightboxIndex].eventId}
          getUploaderName={(photo) => uploaderNames[photo.participantId] ?? "Guest"}
          isSaved={() => false}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(index) => setLightboxIndex(index)}
          onToggleSave={() => {}}
          photos={filteredPhotos}
        />
      )}

      {sharingPhotoId && (() => {
        const photo = photos.find((p) => p.id === sharingPhotoId);
        if (!photo) return null;
        return (
          <PhotoSharePanel
            key={sharingPhotoId}
            onClose={() => setSharingPhotoId(null)}
            originalFileName={photo.originalFileName}
            photoId={sharingPhotoId}
            thumbnailUrl={photo.thumbnailUrl}
          />
        );
      })()}

      {addToAlbumPhotoId && customAlbums && eventPublicId && (
        <AddToAlbumSheet
          customAlbums={customAlbums}
          eventPublicId={eventPublicId}
          onClose={() => setAddToAlbumPhotoId(null)}
          photoId={addToAlbumPhotoId}
        />
      )}
    </section>
  );
}
