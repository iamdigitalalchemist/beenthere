"use client";

import { useMemo, useState } from "react";
import type {
  PhotoRecord,
  PhotoReportSummary,
  PhotoVisibility,
} from "@/types/domain";

type ModerationGridProps = {
  initialPhotos: PhotoRecord[];
  uploaderNames: Record<string, string>;
  reports?: Record<string, PhotoReportSummary>;
};

type ModerationFilter = "all" | "visible" | "hidden" | "reported" | "processing";

type ModerationAction = Extract<
  PhotoVisibility,
  "visible" | "hidden" | "deleted"
>;

const badgeStyles: Record<string, string> = {
  visible: "bg-emerald-100 text-emerald-800",
  hidden: "bg-amber-100 text-amber-800",
  reported: "bg-red-100 text-red-800",
  pending_review: "bg-amber-100 text-amber-800",
};

export function ModerationGrid({
  initialPhotos,
  uploaderNames,
  reports = {},
}: ModerationGridProps) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [photoReports, setPhotoReports] = useState(reports);
  const [filter, setFilter] = useState<ModerationFilter>("all");
  const [message, setMessage] = useState("Moderate photos before the slideshow.");
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null,
  );

  const reportedCount = useMemo(
    () => photos.filter((photo) => photo.visibility === "reported").length,
    [photos],
  );

  const filteredPhotos = useMemo(() => {
    return photos.filter((photo) => {
      if (filter === "processing") {
        return photo.status !== "ready";
      }

      if (filter === "visible" || filter === "hidden" || filter === "reported") {
        return photo.visibility === filter;
      }

      return true;
    });
  }, [filter, photos]);

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
        ? currentPhotos.filter((photo) => photo.id !== photoId)
        : currentPhotos.map((photo) =>
            photo.id === photoId ? { ...photo, visibility } : photo,
          ),
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
        ? "Photo deleted. It no longer appears anywhere."
        : visibility === "hidden"
          ? "Photo hidden from guest gallery and slideshow."
          : "Photo is visible again.",
    );
  }

  return (
    <section className="rounded-3xl bg-surface p-5 shadow-sm ring-1 ring-border">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Photo moderation</h2>
          <p className="mt-1 text-sm text-ink-muted">{message}</p>
        </div>
        <div className="inline-flex flex-wrap gap-1 rounded-full bg-canvas p-1 ring-1 ring-border">
          {(
            ["all", "visible", "hidden", "reported", "processing"] as ModerationFilter[]
          ).map((nextFilter) => (
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
                filter === nextFilter
                  ? "bg-ink text-surface"
                  : "text-ink-muted hover:text-ink"
              }`}
              key={nextFilter}
              onClick={() => setFilter(nextFilter)}
              type="button"
            >
              {nextFilter}
              {nextFilter === "reported" && reportedCount > 0 ? (
                <span className="ml-1.5 rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white">
                  {reportedCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPhotos.map((photo) => {
          const uploaderName = uploaderNames[photo.participantId] ?? "Guest";
          const report = photoReports[photo.id];
          const isReported = photo.visibility === "reported";

          return (
            <article
              className={`overflow-hidden rounded-2xl bg-canvas ring-1 ${
                isReported ? "ring-red-300" : "ring-border"
              }`}
              key={photo.id}
            >
              <div className="aspect-[4/3] bg-border">
                {photo.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={`Uploaded by ${uploaderName}`}
                    className="h-full w-full object-cover"
                    src={photo.thumbnailUrl}
                  />
                ) : (
                  <div className="grid h-full place-items-center text-sm text-ink-muted">
                    Processing preview
                  </div>
                )}
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{uploaderName}</p>
                    <p className="text-xs text-ink-muted">
                      {photo.status} · {photo.visibility}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      badgeStyles[photo.visibility] ?? badgeStyles.visible
                    }`}
                  >
                    {photo.visibility}
                  </span>
                </div>

                {report ? (
                  <div className="rounded-xl bg-red-50 p-3 text-xs text-red-800">
                    <p className="font-bold">
                      {report.count} {report.count === 1 ? "report" : "reports"}
                    </p>
                    {report.reasons.length > 0 ? (
                      <ul className="mt-1 list-inside list-disc space-y-0.5">
                        {report.reasons.slice(0, 3).map((reason, index) => (
                          <li key={index}>{reason}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}

                {confirmingDeleteId === photo.id ? (
                  <div className="flex gap-2">
                    <button
                      className="flex-1 rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
                      onClick={() => void updateVisibility(photo.id, "deleted")}
                      type="button"
                    >
                      Confirm delete
                    </button>
                    <button
                      className="flex-1 rounded-full px-4 py-2 text-sm font-semibold text-ink ring-1 ring-border transition hover:bg-ink/5"
                      onClick={() => setConfirmingDeleteId(null)}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {photo.visibility === "visible" ? (
                      <button
                        className="flex-1 rounded-full bg-ink px-4 py-2 text-sm font-bold text-surface transition hover:bg-ink/90"
                        onClick={() => void updateVisibility(photo.id, "hidden")}
                        type="button"
                      >
                        Hide
                      </button>
                    ) : (
                      <button
                        className="flex-1 rounded-full bg-ink px-4 py-2 text-sm font-bold text-surface transition hover:bg-ink/90"
                        onClick={() => void updateVisibility(photo.id, "visible")}
                        type="button"
                      >
                        {isReported ? "Approve" : "Unhide"}
                      </button>
                    )}
                    {isReported ? (
                      <button
                        className="flex-1 rounded-full px-4 py-2 text-sm font-semibold text-ink ring-1 ring-border transition hover:bg-ink/5"
                        onClick={() => void updateVisibility(photo.id, "hidden")}
                        type="button"
                      >
                        Hide
                      </button>
                    ) : null}
                    <button
                      className="rounded-full px-4 py-2 text-sm font-semibold text-red-600 ring-1 ring-red-200 transition hover:bg-red-50"
                      onClick={() => setConfirmingDeleteId(photo.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {filteredPhotos.length === 0 ? (
        <p className="mt-6 text-sm text-ink-muted">
          No photos in this view.
        </p>
      ) : null}
    </section>
  );
}
