"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  CustomAlbum,
  PhotoRecord,
  PhotoReportSummary,
  SmartAlbum,
} from "@/types/domain";
import { ModerationGrid } from "@/components/dashboard/moderation-grid";

// ─── Add-all-to-album sheet ──────────────────────────────────────────────────

function AddAllToAlbumSheet({
  photoIds,
  customAlbums,
  eventPublicId,
  onClose,
}: {
  photoIds: string[];
  customAlbums: CustomAlbum[];
  eventPublicId: string;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [albums, setAlbums] = useState(customAlbums);

  async function addAll(albumId: string) {
    setSaving(albumId);
    const res = await fetch(`/api/events/${eventPublicId}/albums/${albumId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoIds }),
    });
    setSaving(null);
    if (res.ok) setDone((prev) => new Set([...prev, albumId]));
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
    const newAlbum: CustomAlbum = { id: data.id, name: data.name, photoCount: photoIds.length, coverThumbnailUrl: "", createdAt: new Date().toISOString() };
    setAlbums((prev) => [newAlbum, ...prev]);
    setDone((prev) => new Set([...prev, data.id]));
    setNewName("");
    setCreating(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-md sm:items-center sm:p-4">
      <div className="w-full max-w-sm rounded-t-[2rem] bg-[#0F1023] px-5 pb-8 pt-5 shadow-2xl ring-1 ring-white/10 sm:rounded-[2rem]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white/90">Add to album</h2>
            <p className="text-xs text-white/40">{photoIds.length} photos</p>
          </div>
          <button className="rounded-full p-2 text-white/40 transition hover:text-white/70" onClick={onClose} type="button">✕</button>
        </div>

        {albums.length === 0 && !creating ? (
          <p className="mb-4 text-sm text-white/45">No albums yet. Create one below.</p>
        ) : (
          <ul className="mb-3 max-h-56 space-y-1.5 overflow-y-auto">
            {albums.map((album) => {
              const isDone = done.has(album.id);
              return (
                <li key={album.id}>
                  <button
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition active:scale-[0.99] ${isDone ? "bg-accent/10 ring-1 ring-accent/30" : "bg-white/8 hover:bg-white/12"}`}
                    disabled={saving === album.id || isDone}
                    onClick={() => void addAll(album.id)}
                    type="button"
                  >
                    <span className="text-lg">{isDone ? "✅" : "📁"}</span>
                    <span className="flex-1 truncate text-sm font-semibold text-white/85">{album.name}</span>
                    {saving === album.id && <span className="text-xs text-white/40">Adding…</span>}
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
              className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white/90 outline-none transition"
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void createAndAdd(); if (e.key === "Escape") setCreating(false); }}
              placeholder="Album name…"
              value={newName}
            />
            <div className="flex gap-2">
              <button
                className="flex-1 rounded-full bg-gradient-to-r from-[#FF6DAE] to-[#B35DFF] px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95 disabled:opacity-50"
                disabled={!newName.trim() || saving === "__new__"}
                onClick={() => void createAndAdd()}
                type="button"
              >
                {saving === "__new__" ? "Creating…" : "Create & add all"}
              </button>
              <button
                className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-sm font-semibold text-white/70 transition active:scale-95"
                onClick={() => setCreating(false)}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="mt-1 w-full rounded-full border border-dashed border-white/20 py-2.5 text-sm font-semibold text-white/40 transition hover:border-accent/40 hover:text-accent active:scale-[0.98]"
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

type SmartAlbumsProps = {
  albums: SmartAlbum[];
  customAlbums: CustomAlbum[];
  allPhotos: PhotoRecord[];
  uploaderNames: Record<string, string>;
  reports: Record<string, PhotoReportSummary>;
  eventPublicId: string;
};

const smartTypeEmoji: Record<SmartAlbum["type"], string> = {
  by_uploader: "👤",
  by_date: "📅",
  by_tag: "🏷️",
};

// ─── Create album modal ──────────────────────────────────────────────────────

function CreateAlbumModal({
  eventPublicId,
  onCreated,
  onClose,
}: {
  eventPublicId: string;
  onCreated: (album: CustomAlbum) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/events/${eventPublicId}/albums`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });

    setSaving(false);

    if (!res.ok) {
      setError("Could not create album. Try again.");
      return;
    }

    const data = (await res.json()) as { id: string; name: string };
    onCreated({ id: data.id, name: data.name, photoCount: 0, coverThumbnailUrl: "", createdAt: new Date().toISOString() });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="w-full max-w-sm rounded-[2rem] bg-[#0F1023] p-6 shadow-2xl ring-1 ring-white/10">
        <h2 className="text-lg font-bold text-white/90">New album</h2>
        <p className="mt-1 text-sm text-white/45">Give your album a name.</p>
        <input
          autoFocus
          className="mt-4 w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-base text-white/90 outline-none transition"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void submit(); }}
          placeholder="e.g. Ceremony, Best shots…"
          value={name}
        />
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button
            className="flex-1 rounded-full bg-gradient-to-r from-[#FF6DAE] to-[#B35DFF] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95 disabled:opacity-50"
            disabled={!name.trim() || saving}
            onClick={() => void submit()}
            type="button"
          >
            {saving ? "Creating…" : "Create album"}
          </button>
          <button
            className="flex-1 rounded-full border border-white/10 bg-white/6 px-4 py-2.5 text-sm font-semibold text-white/70 transition active:scale-95"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Rename album modal ──────────────────────────────────────────────────────

function RenameAlbumModal({
  album,
  eventPublicId,
  onRenamed,
  onClose,
}: {
  album: CustomAlbum;
  eventPublicId: string;
  onRenamed: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(album.name);
  const [saving, setSaving] = useState(false);

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === album.name) { onClose(); return; }
    setSaving(true);

    const res = await fetch(`/api/events/${eventPublicId}/albums/${album.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });

    setSaving(false);
    if (res.ok) onRenamed(trimmed);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="w-full max-w-sm rounded-[2rem] bg-[#0F1023] p-6 shadow-2xl ring-1 ring-white/10">
        <h2 className="text-lg font-bold text-white/90">Rename album</h2>
        <input
          autoFocus
          className="mt-4 w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-base text-white/90 outline-none transition"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void submit(); }}
          value={name}
        />
        <div className="mt-4 flex gap-2">
          <button
            className="flex-1 rounded-full bg-gradient-to-r from-[#FF6DAE] to-[#B35DFF] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95 disabled:opacity-50"
            disabled={!name.trim() || saving}
            onClick={() => void submit()}
            type="button"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            className="flex-1 rounded-full border border-white/10 bg-white/6 px-4 py-2.5 text-sm font-semibold text-white/70 transition active:scale-95"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function SmartAlbums({
  albums,
  customAlbums: initialCustomAlbums,
  allPhotos,
  uploaderNames,
  reports,
  eventPublicId,
}: SmartAlbumsProps) {
  const router = useRouter();
  const [customAlbums, setCustomAlbums] = useState(initialCustomAlbums);
  const [activeSmartId, setActiveSmartId] = useState<string | null>(null);
  const [activeCustomId, setActiveCustomId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [renamingAlbum, setRenamingAlbum] = useState<CustomAlbum | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addAllAlbum, setAddAllAlbum] = useState<{ photoIds: string[] } | null>(null);

  const activeSmartAlbum = albums.find((a) => a.id === activeSmartId) ?? null;
  const activeCustomAlbum = customAlbums.find((a) => a.id === activeCustomId) ?? null;

  async function deleteAlbum(albumId: string) {
    setDeletingId(albumId);
    const res = await fetch(`/api/events/${eventPublicId}/albums/${albumId}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      setCustomAlbums((prev) => prev.filter((a) => a.id !== albumId));
    }
  }

  function buildSmartExportUrl(album: SmartAlbum) {
    const params = new URLSearchParams({ [album.filterKey]: album.filterValue });
    return `/api/events/${eventPublicId}/export?${params.toString()}`;
  }

  function buildCustomExportUrl(albumId: string) {
    return `/api/events/${eventPublicId}/export?albumId=${albumId}`;
  }

  // ── Smart album detail view ──
  if (activeSmartAlbum) {
    const smartPhotos = allPhotos.filter((photo) => {
      if (activeSmartAlbum.filterKey === "participantId") return photo.participantId === activeSmartAlbum.filterValue;
      if (activeSmartAlbum.filterKey === "date") return (photo.takenAt ?? photo.uploadedAt).slice(0, 10) === activeSmartAlbum.filterValue;
      return true;
    });

    return (
      <div>
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button
            className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-accent/30 hover:text-accent active:scale-95"
            onClick={() => setActiveSmartId(null)}
            type="button"
          >
            Albums
          </button>
          <div className="min-w-0">
            <h2 className="text-lg font-bold">
              {smartTypeEmoji[activeSmartAlbum.type]} {activeSmartAlbum.label}
            </h2>
            <p className="text-sm text-white/45">{activeSmartAlbum.photoCount} photos</p>
          </div>
          <a
            className="ml-auto shrink-0 rounded-full bg-gradient-to-r from-[#FF6DAE] to-[#B35DFF] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95"
            download
            href={buildSmartExportUrl(activeSmartAlbum)}
          >
            Download ZIP ↓
          </a>
        </div>

        {activeSmartAlbum.filterKey === "taggedParticipantId" ? (
          <TaggedAlbumGrid
            allPhotos={allPhotos}
            eventPublicId={eventPublicId}
            reports={reports}
            taggedName={activeSmartAlbum.label.replace("Tagged: ", "")}
            taggedParticipantId={activeSmartAlbum.filterValue}
            uploaderNames={uploaderNames}
          />
        ) : (
          <ModerationGrid
            customAlbums={customAlbums}
            eventPublicId={eventPublicId}
            initialPhotos={smartPhotos}
            reports={reports}
            uploaderNames={uploaderNames}
          />
        )}
      </div>
    );
  }

  // ── Custom album detail view ──
  if (activeCustomAlbum) {
    return (
      <CustomAlbumDetail
        album={activeCustomAlbum}
        allPhotos={allPhotos}
        customAlbums={customAlbums}
        eventPublicId={eventPublicId}
        exportUrl={buildCustomExportUrl(activeCustomAlbum.id)}
        onBack={() => setActiveCustomId(null)}
        reports={reports}
        uploaderNames={uploaderNames}
      />
    );
  }

  // ── Album list ──
  const hasAny = customAlbums.length > 0 || albums.length > 0;

  const smartSections: Array<{ type: SmartAlbum["type"]; title: string }> = [
    { type: "by_uploader", title: "By guest" },
    { type: "by_date", title: "By date" },
    { type: "by_tag", title: "By tag" },
  ];

  const smartByType: Record<SmartAlbum["type"], SmartAlbum[]> = {
    by_uploader: albums.filter((a) => a.type === "by_uploader"),
    by_date: albums.filter((a) => a.type === "by_date"),
    by_tag: albums.filter((a) => a.type === "by_tag"),
  };

  return (
    <div className="space-y-8">
      {/* Custom albums section */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-white/45">
            📁 My albums
          </h3>
          <button
            className="rounded-full bg-gradient-to-r from-[#FF6DAE] to-[#B35DFF] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95"
            onClick={() => setShowCreate(true)}
            type="button"
          >
            + New album
          </button>
        </div>

        {customAlbums.length === 0 ? (
          <button
            className="flex w-full items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-white/12 bg-white/2 p-8 text-white/40 transition hover:border-accent/30 hover:text-accent active:scale-[0.99]"
            onClick={() => setShowCreate(true)}
            type="button"
          >
            <span className="text-2xl">+</span>
            <span className="text-sm font-semibold">Create your first album</span>
          </button>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {customAlbums.map((album) => (
              <div
                className="group overflow-hidden rounded-3xl shadow-sm ring-1 ring-white/8 bg-white/4"
                key={album.id}
              >
                <button
                  className="block w-full text-left transition hover:opacity-90 active:scale-[0.99]"
                  onClick={() => setActiveCustomId(album.id)}
                  type="button"
                >
                  <div className="aspect-[4/3] bg-black/5">
                    {album.coverThumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt={album.name}
                        className="h-full w-full object-cover"
                        src={album.coverThumbnailUrl}
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-3xl opacity-30">📁</div>
                    )}
                  </div>
                </button>
                <div className="flex items-center justify-between gap-2 p-4">
                  <button
                    className="min-w-0 text-left transition hover:text-accent active:scale-[0.98]"
                    onClick={() => setActiveCustomId(album.id)}
                    type="button"
                  >
                    <p className="truncate font-semibold text-white/85">{album.name}</p>
                    <p className="text-xs text-white/40">
                      {album.photoCount} photo{album.photoCount !== 1 ? "s" : ""}
                    </p>
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    <a
                      className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-semibold text-white/65 transition hover:border-accent/30 hover:text-accent active:scale-95"
                      download
                      href={buildCustomExportUrl(album.id)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      ZIP ↓
                    </a>
                    <button
                      className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1.5 text-xs font-semibold text-white/65 transition active:scale-95"
                      onClick={() => setRenamingAlbum(album)}
                      title="Rename"
                      type="button"
                    >
                      ✏️
                    </button>
                    <button
                      className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-400 transition active:scale-95 disabled:opacity-40"
                      disabled={deletingId === album.id}
                      onClick={() => void deleteAlbum(album.id)}
                      title="Delete album"
                      type="button"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Smart album sections */}
      {smartSections
        .filter((s) => smartByType[s.type].length > 0)
        .map((section) => (
          <div key={section.type}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/45">
              {smartTypeEmoji[section.type]} {section.title}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {smartByType[section.type].map((album) => (
                <div
                  className="group overflow-hidden rounded-3xl shadow-sm ring-1 ring-white/8 transition hover:ring-accent/30 bg-white/4"
                  key={album.id}
                >
                  <button
                    className="block w-full text-left active:scale-[0.99]"
                    onClick={() => setActiveSmartId(album.id)}
                    type="button"
                  >
                    <div className="aspect-[4/3] bg-black/5">
                      {album.coverThumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt={album.label}
                          className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                          src={album.coverThumbnailUrl}
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-2xl">
                          {smartTypeEmoji[album.type]}
                        </div>
                      )}
                    </div>
                  </button>
                  <div className="flex items-center justify-between gap-2 p-4">
                    <button
                      className="min-w-0 text-left transition hover:text-accent active:scale-[0.98]"
                      onClick={() => setActiveSmartId(album.id)}
                      type="button"
                    >
                      <p className="truncate font-semibold text-white/85">{album.label}</p>
                      <p className="text-xs text-white/40">
                        {album.photoCount} photo{album.photoCount !== 1 ? "s" : ""}
                      </p>
                    </button>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-semibold text-white/65 transition hover:border-accent/30 hover:text-accent active:scale-95"
                        onClick={() => {
                          const photoIds = allPhotos
                            .filter((p) => {
                              if (album.filterKey === "participantId") return p.participantId === album.filterValue;
                              if (album.filterKey === "date") return (p.takenAt ?? p.uploadedAt).slice(0, 10) === album.filterValue;
                              return true;
                            })
                            .map((p) => p.id);
                          setAddAllAlbum({ photoIds });
                        }}
                        title="Add all to album"
                        type="button"
                      >
                        + Album
                      </button>
                      <a
                        className="shrink-0 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-semibold text-white/65 transition hover:border-accent/30 hover:text-accent active:scale-95"
                        download
                        href={buildSmartExportUrl(album)}
                      >
                        ZIP ↓
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

      {!hasAny && (
        <div className="mt-4 rounded-3xl border-2 border-dashed border-white/12 bg-white/2 p-12 text-center">
          <p className="font-semibold text-white/85">No albums yet</p>
          <p className="mt-1 text-sm text-white/45">
            Smart albums appear once guests upload and tag photos. Create a manual album above.
          </p>
        </div>
      )}

      {showCreate && (
        <CreateAlbumModal
          eventPublicId={eventPublicId}
          onClose={() => setShowCreate(false)}
          onCreated={(album) => {
            setCustomAlbums((prev) => [album, ...prev]);
            setShowCreate(false);
          }}
        />
      )}

      {renamingAlbum && (
        <RenameAlbumModal
          album={renamingAlbum}
          eventPublicId={eventPublicId}
          onClose={() => setRenamingAlbum(null)}
          onRenamed={(name) => {
            setCustomAlbums((prev) =>
              prev.map((a) => a.id === renamingAlbum.id ? { ...a, name } : a),
            );
            setRenamingAlbum(null);
            router.refresh();
          }}
        />
      )}

      {addAllAlbum && (
        <AddAllToAlbumSheet
          customAlbums={customAlbums}
          eventPublicId={eventPublicId}
          onClose={() => setAddAllAlbum(null)}
          photoIds={addAllAlbum.photoIds}
        />
      )}
    </div>
  );
}

// ─── Custom album detail ─────────────────────────────────────────────────────

function CustomAlbumDetail({
  album,
  allPhotos,
  customAlbums,
  eventPublicId,
  exportUrl,
  onBack,
  reports,
  uploaderNames,
}: {
  album: CustomAlbum;
  allPhotos: PhotoRecord[];
  customAlbums: CustomAlbum[];
  eventPublicId: string;
  exportUrl: string;
  onBack: () => void;
  reports: Record<string, PhotoReportSummary>;
  uploaderNames: Record<string, string>;
}) {
  const [photoIds, setPhotoIds] = useState<Set<string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function loadPhotos() {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventPublicId}/albums/${album.id}/photos`);
      if (res.ok) {
        const data = (await res.json()) as { photoIds: string[] };
        setPhotoIds(new Set(data.photoIds));
      }
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }

  const albumPhotos = photoIds ? allPhotos.filter((p) => photoIds.has(p.id)) : [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-accent/30 hover:text-accent active:scale-95"
          onClick={onBack}
          type="button"
        >
          Albums
        </button>
        <div className="min-w-0">
          <h2 className="text-lg font-bold">📁 {album.name}</h2>
          <p className="text-sm text-white/45">{album.photoCount} photos</p>
        </div>
        <a
          className="ml-auto shrink-0 rounded-full bg-gradient-to-r from-[#FF6DAE] to-[#B35DFF] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95"
          download
          href={exportUrl}
        >
          Download ZIP ↓
        </a>
      </div>

      {!loaded ? (
        <div className="mt-4 text-center">
          <button
            className="rounded-full bg-gradient-to-r from-[#FF6DAE] to-[#B35DFF] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95 disabled:opacity-50"
            disabled={loading}
            onClick={() => void loadPhotos()}
            type="button"
          >
            {loading ? "Loading…" : "Load album photos"}
          </button>
        </div>
      ) : (
        <ModerationGrid
          customAlbums={customAlbums}
          eventPublicId={eventPublicId}
          initialPhotos={albumPhotos}
          reports={reports}
          uploaderNames={uploaderNames}
        />
      )}
    </div>
  );
}

// ─── Tagged album grid ───────────────────────────────────────────────────────

function TaggedAlbumGrid({
  taggedParticipantId,
  taggedName,
  eventPublicId,
  allPhotos,
  uploaderNames,
  reports,
  customAlbums,
}: {
  taggedParticipantId: string;
  taggedName: string;
  eventPublicId: string;
  allPhotos: PhotoRecord[];
  uploaderNames: Record<string, string>;
  reports: Record<string, PhotoReportSummary>;
  customAlbums?: CustomAlbum[];
}) {
  const [taggedPhotoIds, setTaggedPhotoIds] = useState<Set<string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function loadTaggedPhotos() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/events/${eventPublicId}/tagged-photos?taggedParticipantId=${taggedParticipantId}`,
      );
      if (res.ok) {
        const data = (await res.json()) as { photoIds: string[] };
        setTaggedPhotoIds(new Set(data.photoIds));
      }
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }

  if (!loaded) {
    return (
      <div className="mt-4 text-center">
        <button
          className="rounded-full bg-gradient-to-r from-[#FF6DAE] to-[#B35DFF] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95 disabled:opacity-50"
          disabled={loading}
          onClick={() => void loadTaggedPhotos()}
          type="button"
        >
          {loading ? "Loading…" : `Load photos tagged as ${taggedName}`}
        </button>
      </div>
    );
  }

  const photos = taggedPhotoIds
    ? allPhotos.filter((p) => taggedPhotoIds.has(p.id))
    : allPhotos;

  return (
    <ModerationGrid
      customAlbums={customAlbums}
      eventPublicId={eventPublicId}
      initialPhotos={photos}
      reports={reports}
      uploaderNames={uploaderNames}
    />
  );
}
