"use client";

import Link from "next/link";
import { useState } from "react";
import { ModerationGrid } from "@/components/dashboard/moderation-grid";
import { SmartAlbums } from "@/components/dashboard/smart-albums";
import type { CustomAlbum, PhotoRecord, PhotoReportSummary, SmartAlbum } from "@/types/domain";

type Props = {
  base: string;
  view: string;
  albums: SmartAlbum[];
  customAlbums: CustomAlbum[];
  allPhotos: PhotoRecord[];
  uploaderNames: Record<string, string>;
  reports: Record<string, PhotoReportSummary>;
  eventPublicId: string;
  eventId: string;
  totalAlbums: number;
};

export function PhotosTabHeader({
  base, view, albums, customAlbums, allPhotos, uploaderNames, reports, eventPublicId, eventId, totalAlbums,
}: Props) {
  const [selectMode, setSelectMode] = useState(false);

  return (
    <div>
      {/* Sub-toggle row + Select button */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex gap-1 rounded-2xl p-1 w-fit overflow-x-auto" style={{ background: "rgba(255,255,255,.06)" }}>
          {[
            { id: "all", label: "All photos" },
            { id: "albums", label: `Albums${totalAlbums > 0 ? ` · ${totalAlbums}` : ""}` },
          ].map((v) => (
            <Link
              className="rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap transition active:scale-95"
              href={`${base}?tab=photos&view=${v.id}`}
              key={v.id}
              style={view === v.id
                ? { background: "rgba(255,255,255,.10)", color: "rgba(255,255,255,.92)" }
                : { color: "rgba(255,255,255,.40)" }
              }
            >
              {v.label}
            </Link>
          ))}
        </div>

        {view === "all" && (
          <button
            className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold transition active:scale-95"
            onClick={() => setSelectMode((v) => !v)}
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

      {view === "albums" ? (
        <SmartAlbums
          albums={albums}
          allPhotos={allPhotos}
          customAlbums={customAlbums}
          eventPublicId={eventPublicId}
          reports={reports}
          uploaderNames={uploaderNames}
        />
      ) : (
        <ModerationGrid
          customAlbums={customAlbums}
          eventId={eventId}
          eventPublicId={eventPublicId}
          externalSelectMode={selectMode}
          initialPhotos={allPhotos}
          onExternalSelectModeChange={setSelectMode}
          reports={reports}
          uploaderNames={uploaderNames}
        />
      )}
    </div>
  );
}
