"use client";

import { useEffect, useMemo, useState } from "react";
import { PhotoSharePanel } from "@/components/dashboard/photo-share-panel";
import { PhotoDetailView } from "@/components/gallery/photo-detail-view";
import { ViewSizeToggle, type ViewSize } from "@/components/view-size-toggle";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
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
  customAlbums?: CustomAlbum[];
  eventPublicId?: string;
  eventId?: string;
  externalSelectMode?: boolean;
  onExternalSelectModeChange?: (v: boolean) => void;
};

type VisibilityFilter = "all" | "visible" | "hidden" | "gallery" | "reported";
type ModerationAction = Extract<PhotoVisibility, "visible" | "hidden" | "deleted">;

// ─── Icons ───────────────────────────────────────────────────────────────────

function IconEyeOff() {
  return (
    <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" x2="23" y1="1" y2="23"/>
    </svg>
  );
}

function IconEye() {
  return (
    <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function IconTrash() {
  return (
    <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}

function IconFolderPlus() {
  return (
    <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      <line x1="12" x2="12" y1="11" y2="17"/>
      <line x1="9" x2="15" y1="14" y2="14"/>
    </svg>
  );
}

function IconShare() {
  return (
    <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
      <polyline points="16 6 12 2 8 6"/>
      <line x1="12" x2="12" y1="2" y2="15"/>
    </svg>
  );
}

function IconCheck() {
  return (
    <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="16">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function IconGalleryAdd() {
  return (
    <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
      <rect height="18" rx="2" ry="2" width="18" x="3" y="3"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
      <line x1="19" x2="19" y1="3" y2="9"/>
      <line x1="16" x2="22" y1="6" y2="6"/>
    </svg>
  );
}

function IconGalleryRemove() {
  return (
    <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
      <rect height="18" rx="2" ry="2" width="18" x="3" y="3"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
      <line x1="16" x2="22" y1="6" y2="6"/>
    </svg>
  );
}

const badgeStyles: Record<string, React.CSSProperties> = {
  visible:        { background: "rgba(86,216,146,.15)",  color: "#56D892", border: "1px solid rgba(86,216,146,.20)" },
  hidden:         { background: "rgba(255,190,85,.12)",  color: "#FFBE55", border: "1px solid rgba(255,190,85,.18)" },
  reported:       { background: "rgba(255,95,123,.12)",  color: "#FF8FA3", border: "1px solid rgba(255,95,123,.18)" },
  pending_review: { background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.40)", border: "1px solid rgba(255,255,255,.08)" },
};

function galleryBadge(inGallery: boolean) {
  return inGallery
    ? "bg-accent/10 text-accent"
    : "bg-black/5 text-ink-muted";
}

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

// ─── Bulk add-to-album sheet ─────────────────────────────────────────────────

function BulkAddToAlbumSheet({
  photoIds,
  eventPublicId,
  customAlbums,
  onClose,
}: {
  photoIds: string[];
  eventPublicId: string;
  customAlbums: CustomAlbum[];
  onClose: () => void;
}) {
  const [saving, setSaving] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [albums, setAlbums] = useState(customAlbums);

  async function addAll(albumId: string) {
    setSaving(albumId);
    await fetch(`/api/events/${eventPublicId}/albums/${albumId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoIds }),
    });
    setSaving(null);
    setDone((prev) => new Set([...prev, albumId]));
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
      body: JSON.stringify({ photoIds }),
    });
    setSaving(null);
    setAlbums((prev) => [{ id: data.id, name: data.name, photoCount: photoIds.length, coverThumbnailUrl: "", createdAt: new Date().toISOString() }, ...prev]);
    setDone((prev) => new Set([...prev, data.id]));
    setNewName("");
    setCreating(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full max-w-sm rounded-t-[2rem] bg-white px-5 pb-8 pt-5 shadow-2xl ring-1 ring-black/5 sm:rounded-[2rem]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-black/15 sm:hidden" />
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">Add to album</h2>
            <p className="text-xs text-ink-muted">{photoIds.length} photos</p>
          </div>
          <button className="rounded-full p-2 text-ink-muted transition hover:bg-black/5 hover:text-ink" onClick={onClose} type="button">✕</button>
        </div>
        {albums.length === 0 && !creating ? (
          <p className="mb-4 text-sm text-ink-muted">No albums yet. Create one below.</p>
        ) : (
          <ul className="mb-3 max-h-56 space-y-1.5 overflow-y-auto">
            {albums.map((album) => {
              const isDone = done.has(album.id);
              return (
                <li key={album.id}>
                  <button
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition active:scale-[0.99] ${isDone ? "bg-accent/10 ring-1 ring-accent/30" : "bg-black/5 hover:bg-black/8"}`}
                    disabled={saving === album.id || isDone}
                    onClick={() => void addAll(album.id)}
                    type="button"
                  >
                    <span className="text-lg">{isDone ? "✅" : "📁"}</span>
                    <span className="flex-1 truncate text-sm font-semibold text-ink">{album.name}</span>
                    {saving === album.id && <span className="text-xs text-ink-muted">Adding…</span>}
                    {isDone && <span className="text-xs font-semibold text-accent">Added</span>}
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
              <button className="flex-1 rounded-full bg-ink px-3 py-2 text-sm font-semibold text-white transition hover:bg-ink/80 active:scale-95 disabled:opacity-50" disabled={!newName.trim() || saving === "__new__"} onClick={() => void createAndAdd()} type="button">
                {saving === "__new__" ? "Creating…" : "Create & add all"}
              </button>
              <button className="rounded-full border border-black/10 px-3 py-2 text-sm font-semibold text-ink transition hover:bg-black/5 active:scale-95" onClick={() => setCreating(false)} type="button">Cancel</button>
            </div>
          </div>
        ) : (
          <button className="mt-1 w-full rounded-full border border-dashed border-black/20 py-2.5 text-sm font-semibold text-ink-muted transition hover:border-accent/40 hover:text-accent active:scale-[0.98]" onClick={() => setCreating(true)} type="button">+ New album</button>
        )}
      </div>
    </div>
  );
}

// ─── Main grid ───────────────────────────────────────────────────────────────

type PhotosApiResponse = {
  photos: PhotoRecord[];
  uploaderNames: Record<string, string>;
};

export function ModerationGrid({
  initialPhotos,
  uploaderNames: initialUploaderNames,
  reports = {},
  customAlbums,
  eventPublicId,
  eventId,
  externalSelectMode,
  onExternalSelectModeChange,
}: ModerationGridProps) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploaderNames, setUploaderNames] = useState(initialUploaderNames);
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
  const [internalSelectMode, setInternalSelectMode] = useState(false);
  const selectMode = externalSelectMode ?? internalSelectMode;
  const setSelectMode = onExternalSelectModeChange ?? setInternalSelectMode;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkWorking, setBulkWorking] = useState(false);
  const [bulkAlbumIds, setBulkAlbumIds] = useState<string[] | null>(null);

  async function toggleGallery(photoId: string, inGallery: boolean) {
    setPhotos((current) =>
      current.map((p) => p.id === photoId ? { ...p, inGallery } : p),
    );
    const res = await fetch(`/api/photos/${photoId}/gallery`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inGallery }),
    });
    if (!res.ok) {
      setPhotos((current) =>
        current.map((p) => p.id === photoId ? { ...p, inGallery: !inGallery } : p),
      );
    }
  }

  async function bulkToggleGallery(inGallery: boolean) {
    if (!selectedIds.size) return;
    setBulkWorking(true);
    const ids = Array.from(selectedIds);
    setPhotos((current) =>
      current.map((p) => selectedIds.has(p.id) ? { ...p, inGallery } : p),
    );
    await Promise.all(ids.map((id) =>
      fetch(`/api/photos/${id}/gallery`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inGallery }),
      }),
    ));
    setBulkWorking(false);
    exitSelectMode();
  }
  useEffect(() => {
    if (!eventId) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    async function refreshPhotos() {
      const res = await fetch(`/api/events/${eventId}/photos`);
      if (!res.ok) return;
      const body = (await res.json()) as PhotosApiResponse;
      setPhotos((current) => {
        const currentMap = new Map(current.map((p) => [p.id, p]));
        return body.photos.map((p) => {
          const existing = currentMap.get(p.id);
          if (!existing) return p;
          return {
            ...p,
            thumbnailUrl: p.thumbnailUrl || existing.thumbnailUrl,
            previewUrl: p.previewUrl || existing.previewUrl,
          };
        });
      });
      setUploaderNames(body.uploaderNames);
    }

    const channel = supabase
      .channel(`dashboard-photos:${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "beenthere", table: "photos", filter: `event_id=eq.${eventId}` },
        () => { void refreshPhotos(); },
      )
      .subscribe();

    // Also poll every 8s as a hard fallback — covers cases where the
    // Supabase subscription doesn't fire (e.g. new photos from guests).
    const poll = setInterval(() => { void refreshPhotos(); }, 8000);

    return () => {
      void supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [eventId]);


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

  const galleryCount = useMemo(
    () => photos.filter((p) => p.inGallery).length,
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
      if (visibilityFilter === "visible" && photo.visibility !== "visible") return false;
      if (visibilityFilter === "hidden" && photo.visibility !== "hidden") return false;
      if (visibilityFilter === "reported" && photo.visibility !== "reported") return false;
      if (visibilityFilter === "gallery" && !photo.inGallery) return false;
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
        : currentPhotos.map((p) => p.id === photoId
            ? { ...p, visibility, inGallery: (visibility === "hidden") ? false : p.inGallery }
            : p),
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

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredPhotos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPhotos.map((p) => p.id)));
    }
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  async function bulkUpdateVisibility(visibility: ModerationAction) {
    if (!selectedIds.size) return;
    setBulkWorking(true);
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map((id) =>
      fetch(`/api/photos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility }),
      }),
    ));
    setPhotos((current) =>
      visibility === "deleted"
        ? current.filter((p) => !selectedIds.has(p.id))
        : current.map((p) => selectedIds.has(p.id) ? { ...p, visibility } : p),
    );
    setBulkWorking(false);
    exitSelectMode();
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
              className="rounded-2xl px-4 py-2 text-sm font-semibold outline-none transition"
              onChange={(e) => setUploaderFilter(e.target.value)}
              style={{
                background: uploaderFilter !== "all" ? "rgba(224,182,255,.12)" : "rgba(255,255,255,.06)",
                border: uploaderFilter !== "all" ? "1px solid rgba(224,182,255,.25)" : "1px solid rgba(255,255,255,.10)",
                color: uploaderFilter !== "all" ? "#e0b6ff" : "rgba(255,255,255,.70)",
                colorScheme: "dark",
              }}
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
              className="rounded-2xl px-4 py-2 text-sm font-semibold outline-none transition"
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                background: dateFilter !== "all" ? "rgba(224,182,255,.12)" : "rgba(255,255,255,.06)",
                border: dateFilter !== "all" ? "1px solid rgba(224,182,255,.25)" : "1px solid rgba(255,255,255,.10)",
                color: dateFilter !== "all" ? "#e0b6ff" : "rgba(255,255,255,.70)",
                colorScheme: "dark",
              }}
              value={dateFilter}
            >
              <option value="all">All dates</option>
              {dateOptions.map((d) => (
                <option key={d} value={d}>
                  {new Date(d + "T12:00:00").toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" })}
                </option>
              ))}
            </select>
          )}

          {activeFilterCount > 0 && (
            <button
              className="rounded-2xl px-4 py-2 text-sm font-semibold transition active:scale-95"
              onClick={clearFilters}
              style={{ background: "rgba(255,95,123,.10)", border: "1px solid rgba(255,95,123,.15)", color: "#FF8FA3" }}
              type="button"
            >
              Clear filters ×
            </button>
          )}
        </div>

        {/* Visibility pills + size toggle row */}
        <div className="space-y-2">
          {/* Top row: pills left, ViewSizeToggle (desktop) + Select right */}
          <div className="flex items-center justify-between gap-2">
            {/* Left: filter pills or select-mode controls */}
            {selectMode ? (
              <div className="flex items-center gap-3 min-w-0">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold" style={{ color: "rgba(255,255,255,.80)" }}>
                  <input
                    checked={selectedIds.size === filteredPhotos.length && filteredPhotos.length > 0}
                    className="size-4 accent-accent"
                    onChange={toggleSelectAll}
                    type="checkbox"
                  />
                  {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
                </label>
                <button
                  className="text-sm font-semibold transition active:scale-95"
                  onClick={exitSelectMode}
                  style={{ color: "rgba(255,255,255,.40)" }}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div
                className="relative min-w-0 overflow-x-auto rounded-2xl py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{ background: "rgba(255,255,255,.06)" }}
              >
                <div className="flex gap-1 p-1 w-max sm:w-fit">
                  {([
                    { id: "all", label: "All" },
                    { id: "visible", label: "Visible" },
                    { id: "hidden", label: "Hidden" },
                    { id: "gallery", label: "Gallery" },
                    { id: "reported", label: "Reported" },
                  ] as { id: VisibilityFilter; label: string }[]).map(({ id, label }) => (
                    <button
                      className="rounded-xl px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition active:scale-95"
                      key={id}
                      onClick={() => setVisibilityFilter(id)}
                      style={visibilityFilter === id
                        ? { background: "rgba(255,255,255,.12)", color: "rgba(255,255,255,.92)" }
                        : { color: "rgba(255,255,255,.40)" }
                      }
                      type="button"
                    >
                      {label}
                      {id === "reported" && reportedCount > 0 && (
                        <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {reportedCount}
                        </span>
                      )}
                      {id === "gallery" && (
                        <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "rgba(224,182,255,.15)", color: "#e0b6ff" }}>
                          {galleryCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Right: ViewSizeToggle (desktop) + Select button */}
            <div className="flex shrink-0 items-center gap-1.5">
              {!selectMode && (
                <>
                  <div className="hidden sm:block">
                    <ViewSizeToggle onChange={changeViewSize} value={viewSize} />
                  </div>
                  <button
                    className="flex size-8 items-center justify-center rounded-lg transition active:scale-95 sm:hidden"
                    onClick={() => changeViewSize(viewSize === "compact" ? "medium" : viewSize === "medium" ? "large" : "compact")}
                    style={{ background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.55)" }}
                    title="Change grid size"
                    type="button"
                  >
                    {viewSize === "compact" ? (
                      <svg fill="currentColor" height="14" viewBox="0 0 16 16" width="14"><rect height="4" rx="0.75" width="4" x="1" y="1"/><rect height="4" rx="0.75" width="4" x="6" y="1"/><rect height="4" rx="0.75" width="4" x="11" y="1"/><rect height="4" rx="0.75" width="4" x="1" y="6"/><rect height="4" rx="0.75" width="4" x="6" y="6"/><rect height="4" rx="0.75" width="4" x="11" y="6"/><rect height="4" rx="0.75" width="4" x="1" y="11"/><rect height="4" rx="0.75" width="4" x="6" y="11"/><rect height="4" rx="0.75" width="4" x="11" y="11"/></svg>
                    ) : viewSize === "medium" ? (
                      <svg fill="currentColor" height="14" viewBox="0 0 16 16" width="14"><rect height="6.5" rx="1" width="6.5" x="1" y="1"/><rect height="6.5" rx="1" width="6.5" x="8.5" y="1"/><rect height="6.5" rx="1" width="6.5" x="1" y="8.5"/><rect height="6.5" rx="1" width="6.5" x="8.5" y="8.5"/></svg>
                    ) : (
                      <svg fill="currentColor" height="14" viewBox="0 0 16 16" width="14"><rect height="6.5" rx="1.5" width="14" x="1" y="1"/><rect height="6.5" rx="1.5" width="14" x="1" y="8.5"/></svg>
                    )}
                  </button>
                </>
              )}
              {/* Select button only shown when no external controller */}
              {!onExternalSelectModeChange && (
                <button
                  className="rounded-full px-3 py-1.5 text-sm font-semibold transition active:scale-95"
                  onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
                  style={selectMode
                    ? { background: "rgba(255,109,174,.15)", border: "1px solid rgba(255,109,174,.25)", color: "#FF6DAE" }
                    : { background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)", color: "rgba(255,255,255,.65)" }
                  }
                  type="button"
                >
                  Select
                </button>
              )}
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

          const isSelected = selectedIds.has(photo.id);

          return (
            <article
              className={`overflow-hidden transition ${viewSize === "compact" ? "rounded-2xl" : "rounded-3xl"}`}
              key={photo.id}
              style={{
                background: "rgba(255,255,255,.04)",
                border: isSelected
                  ? "2px solid #e0b6ff"
                  : isReported
                    ? "2px solid rgba(255,95,123,.30)"
                    : "1px solid rgba(255,255,255,.08)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 4px 16px rgba(0,0,0,.24)",
              }}
            >
              <div className="relative">
                {selectMode && (
                  <button
                    className="absolute inset-0 z-10 cursor-pointer"
                    onClick={() => toggleSelect(photo.id)}
                    type="button"
                  />
                )}
                {selectMode && (
                  <div className={`pointer-events-none absolute left-2 top-2 z-20 flex size-6 items-center justify-center rounded-full border-2 transition ${isSelected ? "border-accent bg-accent" : "border-white/80 bg-black/30"}`}>
                    {isSelected && (
                      <svg fill="none" height="12" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="12">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                )}
                <button
                  className="block w-full cursor-zoom-in"
                  onClick={() => !selectMode && setLightboxIndex(filteredPhotos.indexOf(photo))}
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

                {viewSize === "compact" && (
                  <div className="absolute bottom-1.5 right-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 [article:hover_&]:opacity-100">
                    {confirmingDeleteId === photo.id ? (
                      <>
                        <button
                          className="grid size-7 place-items-center rounded-full bg-red-500 text-white shadow transition hover:bg-red-600 active:scale-95"
                          onClick={() => void updateVisibility(photo.id, "deleted")}
                          title="Confirm delete"
                          type="button"
                        >
                          <IconTrash />
                        </button>
                        <button
                          className="grid size-7 place-items-center rounded-full bg-white/90 text-ink shadow backdrop-blur-sm transition hover:bg-white active:scale-95"
                          onClick={() => setConfirmingDeleteId(null)}
                          title="Cancel"
                          type="button"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        {photo.visibility === "visible" ? (
                          <button
                            className="grid size-7 place-items-center rounded-full bg-black/60 text-white shadow backdrop-blur-sm transition hover:bg-black/80 active:scale-95"
                            onClick={() => void updateVisibility(photo.id, "hidden")}
                            title="Hide"
                            type="button"
                          >
                            <IconEyeOff />
                          </button>
                        ) : (
                          <button
                            className="grid size-7 place-items-center rounded-full bg-black/60 text-white shadow backdrop-blur-sm transition hover:bg-black/80 active:scale-95"
                            onClick={() => void updateVisibility(photo.id, "visible")}
                            title={isReported ? "Approve" : "Unhide"}
                            type="button"
                          >
                            {isReported ? <IconCheck /> : <IconEye />}
                          </button>
                        )}
                        {photo.visibility === "visible" && (
                          <button
                            className={`grid size-7 place-items-center rounded-full shadow backdrop-blur-sm transition active:scale-95 ${photo.inGallery ? "bg-accent text-white hover:bg-accent/80" : "bg-black/60 text-white hover:bg-black/80"}`}
                            onClick={() => void toggleGallery(photo.id, !photo.inGallery)}
                            title={photo.inGallery ? "Remove from gallery" : "Add to gallery"}
                            type="button"
                          >
                            {photo.inGallery ? <IconGalleryRemove /> : <IconGalleryAdd />}
                          </button>
                        )}
                        <button
                          className="grid size-7 place-items-center rounded-full bg-black/60 text-red-300 shadow backdrop-blur-sm transition hover:bg-black/80 active:scale-95"
                          onClick={() => setConfirmingDeleteId(photo.id)}
                          title="Delete"
                          type="button"
                        >
                          <IconTrash />
                        </button>
                        {customAlbums && eventPublicId && (
                          <button
                            className="grid size-7 place-items-center rounded-full bg-black/60 text-white shadow backdrop-blur-sm transition hover:bg-black/80 active:scale-95"
                            onClick={() => setAddToAlbumPhotoId(photo.id)}
                            title="Add to album"
                            type="button"
                          >
                            <IconFolderPlus />
                          </button>
                        )}
                        <button
                          className="grid size-7 place-items-center rounded-full bg-black/60 text-white shadow backdrop-blur-sm transition hover:bg-black/80 active:scale-95"
                          onClick={() => setSharingPhotoId(photo.id)}
                          title="Share"
                          type="button"
                        >
                          <IconShare />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {viewSize === "compact" ? null : <div className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold" style={{ color: "rgba(255,255,255,.85)" }}>{uploaderName}</p>
                    <p className="text-[11px] capitalize" style={{ color: "rgba(255,255,255,.35)" }}>
                      {(photo.takenAt ?? photo.uploadedAt).slice(0, 10)} · {photo.status}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <span
                      className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize"
                      style={badgeStyles[photo.visibility] ?? badgeStyles.visible}
                    >
                      {photo.visibility}
                    </span>
                    {photo.inGallery && (
                      <span
                        className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                        style={{ background: "rgba(224,182,255,.12)", color: "#e0b6ff", border: "1px solid rgba(224,182,255,.18)" }}
                      >
                        Gallery
                      </span>
                    )}
                  </div>
                </div>

                {report && (
                  <div
                    className="rounded-2xl px-3 py-2.5 text-xs"
                    style={{ background: "rgba(255,95,123,.10)", border: "1px solid rgba(255,95,123,.18)", color: "#FF8FA3" }}
                  >
                    <p className="font-bold">{report.count} {report.count === 1 ? "report" : "reports"}</p>
                    {report.reasons.length > 0 && (
                      <ul className="mt-1 list-inside list-disc space-y-0.5" style={{ color: "rgba(255,143,163,.80)" }}>
                        {report.reasons.slice(0, 3).map((reason, i) => <li key={i}>{reason}</li>)}
                      </ul>
                    )}
                  </div>
                )}

                {confirmingDeleteId === photo.id ? (
                  <div className="flex gap-2">
                    <button
                      className="flex-1 rounded-full px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95"
                      onClick={() => void updateVisibility(photo.id, "deleted")}
                      style={{ background: "#FF5F7B" }}
                      type="button"
                    >
                      Confirm delete
                    </button>
                    <button
                      className="flex-1 rounded-full px-3 py-2 text-sm font-semibold transition active:scale-95"
                      onClick={() => setConfirmingDeleteId(null)}
                      style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)", color: "rgba(255,255,255,.65)" }}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    {photo.visibility === "visible" ? (
                      <button
                        className="grid size-9 place-items-center rounded-full text-white transition hover:brightness-110 active:scale-95"
                        onClick={() => void updateVisibility(photo.id, "hidden")}
                        style={{ background: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.12)" }}
                        title="Hide"
                        type="button"
                      >
                        <IconEyeOff />
                      </button>
                    ) : (
                      <button
                        className="grid size-9 place-items-center rounded-full text-white transition hover:brightness-110 active:scale-95"
                        onClick={() => void updateVisibility(photo.id, "visible")}
                        style={{ background: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.12)" }}
                        title={isReported ? "Approve" : "Unhide"}
                        type="button"
                      >
                        {isReported ? <IconCheck /> : <IconEye />}
                      </button>
                    )}
                    <button
                      className={`grid size-9 place-items-center rounded-full transition active:scale-95 ${photo.visibility !== "visible" ? "cursor-not-allowed opacity-30" : ""}`}
                      disabled={photo.visibility !== "visible"}
                      onClick={() => void toggleGallery(photo.id, !photo.inGallery)}
                      style={photo.inGallery
                        ? { background: "rgba(224,182,255,.15)", border: "1px solid rgba(224,182,255,.25)", color: "#e0b6ff" }
                        : { background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)", color: "rgba(255,255,255,.50)" }
                      }
                      title={photo.inGallery ? "Remove from gallery" : "Add to gallery"}
                      type="button"
                    >
                      {photo.inGallery ? <IconGalleryRemove /> : <IconGalleryAdd />}
                    </button>
                    <button
                      className="grid size-9 place-items-center rounded-full transition active:scale-95"
                      style={{ background: "rgba(255,95,123,.10)", border: "1px solid rgba(255,95,123,.18)", color: "#FF8FA3" }}
                      onClick={() => setConfirmingDeleteId(photo.id)}
                      title="Delete"
                      type="button"
                    >
                      <IconTrash />
                    </button>
                    {customAlbums && eventPublicId && (
                      <button
                        className="grid size-9 place-items-center rounded-full transition active:scale-95"
                        onClick={() => setAddToAlbumPhotoId(photo.id)}
                        style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)", color: "rgba(255,255,255,.60)" }}
                        title="Add to album"
                        type="button"
                      >
                        <IconFolderPlus />
                      </button>
                    )}
                    <button
                      className="grid size-9 place-items-center rounded-full transition active:scale-95"
                      onClick={() => setSharingPhotoId(photo.id)}
                      style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)", color: "rgba(255,255,255,.60)" }}
                      title="Share"
                      type="button"
                    >
                      <IconShare />
                    </button>
                  </div>
                )}
              </div>}
            </article>
          );
        })}
      </div>

      {filteredPhotos.length === 0 && (
        <div
          className="mt-8 rounded-3xl p-12 text-center"
          style={{ border: "1px dashed rgba(255,255,255,.10)", background: "rgba(255,255,255,.02)" }}
        >
          <p className="font-semibold" style={{ color: "rgba(255,255,255,.80)" }}>No photos match</p>
          <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,.35)" }}>
            {activeFilterCount > 0 || visibilityFilter !== "all"
              ? "Try clearing the filters above."
              : "No photos in this view yet."}
          </p>
          {(activeFilterCount > 0 || visibilityFilter !== "all") && (
            <button
              className="mt-3 rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95"
              onClick={clearFilters}
              style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)", color: "rgba(255,255,255,.60)" }}
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

      {bulkAlbumIds && customAlbums && eventPublicId && (
        <BulkAddToAlbumSheet
          customAlbums={customAlbums}
          eventPublicId={eventPublicId}
          onClose={() => { setBulkAlbumIds(null); exitSelectMode(); }}
          photoIds={bulkAlbumIds}
        />
      )}

      {/* ── Bulk action bar ── */}
      {selectMode && selectedIds.size > 0 && (
        <div className="sticky bottom-4 z-40 mt-4 flex justify-center">
          <div className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 shadow-xl ring-1 ring-white/10">
            <span className="pr-2 text-sm font-semibold text-white">
              {selectedIds.size} selected
            </span>
            <button
              className="grid size-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95 disabled:opacity-50"
              disabled={bulkWorking}
              onClick={() => void bulkUpdateVisibility("visible")}
              title="Show all"
              type="button"
            >
              <IconEye />
            </button>
            <button
              className="grid size-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95 disabled:opacity-50"
              disabled={bulkWorking}
              onClick={() => void bulkUpdateVisibility("hidden")}
              title="Hide all"
              type="button"
            >
              <IconEyeOff />
            </button>
            <button
              className="grid size-9 place-items-center rounded-full bg-accent/80 text-white transition hover:bg-accent active:scale-95 disabled:opacity-50"
              disabled={bulkWorking}
              onClick={() => void bulkToggleGallery(true)}
              title="Add all to gallery"
              type="button"
            >
              <IconGalleryAdd />
            </button>
            <button
              className="grid size-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95 disabled:opacity-50"
              disabled={bulkWorking}
              onClick={() => void bulkToggleGallery(false)}
              title="Remove all from gallery"
              type="button"
            >
              <IconGalleryRemove />
            </button>
            {customAlbums && eventPublicId && (
              <button
                className="grid size-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95 disabled:opacity-50"
                disabled={bulkWorking}
                onClick={() => setBulkAlbumIds(Array.from(selectedIds))}
                title="Add to album"
                type="button"
              >
                <IconFolderPlus />
              </button>
            )}
            <button
              className="grid size-9 place-items-center rounded-full bg-red-500/80 text-white transition hover:bg-red-500 active:scale-95 disabled:opacity-50"
              disabled={bulkWorking}
              onClick={() => void bulkUpdateVisibility("deleted")}
              title="Delete all"
              type="button"
            >
              <IconTrash />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
