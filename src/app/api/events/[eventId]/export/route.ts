import { PassThrough, Readable } from "node:stream";
import { NextResponse } from "next/server";
import { ZipArchive } from "archiver";
import { getEventManagerForApi } from "@/server/auth";
import { getEventGallery } from "@/server/data";
import { getDatabasePool } from "@/server/db";
import { getR2ObjectBuffer } from "@/server/r2";
import { getAlbumPhotoIds } from "@/server/custom-albums";
import * as Sentry from "@sentry/nextjs";
import type { PhotoRecord } from "@/types/domain";

type EventExportRouteProps = {
  params: Promise<{
    eventId: string;
  }>;
};

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

function isoDateString(iso: string) {
  return iso.slice(0, 10);
}

async function getTaggedPhotoIds(
  pool: NonNullable<ReturnType<typeof getDatabasePool>>,
  taggedParticipantId: string,
): Promise<Set<string>> {
  const { rows } = await pool.query<{ photo_id: string }>(
    `select photo_id from beenthere.photo_tags where tagged_participant_id = $1`,
    [taggedParticipantId],
  );
  return new Set(rows.map((r) => r.photo_id));
}

function applyFilter(
  photos: PhotoRecord[],
  uploaderNames: Record<string, string>,
  params: URLSearchParams,
  taggedPhotoIds: Set<string> | null,
): PhotoRecord[] {
  let result = photos.filter(
    (p) => p.status === "ready" && p.visibility === "visible",
  );

  const participantId = params.get("participantId");
  const date = params.get("date");

  if (participantId) {
    result = result.filter((p) => p.participantId === participantId);
  }

  if (date) {
    result = result.filter(
      (p) => isoDateString(p.takenAt ?? p.uploadedAt) === date,
    );
  }

  if (taggedPhotoIds) {
    result = result.filter((p) => taggedPhotoIds.has(p.id));
  }

  return result;
}

export async function GET(request: Request, { params }: EventExportRouteProps) {
  if (!getDatabasePool()) {
    return NextResponse.json(
      { error: "Exports require a configured database." },
      { status: 501 },
    );
  }

  const { eventId: publicId } = await params;
  const gallery = await getEventGallery(publicId);

  if (!gallery) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const host = await getEventManagerForApi(gallery.event.ownerUserId);

  if (!host.ok) {
    return NextResponse.json({ error: host.error }, { status: host.status });
  }

  const url = new URL(request.url);
  const pool = getDatabasePool()!;

  const taggedParticipantId = url.searchParams.get("taggedParticipantId");
  const albumId = url.searchParams.get("albumId");

  const [taggedPhotoIds, albumPhotoIdList] = await Promise.all([
    taggedParticipantId ? getTaggedPhotoIds(pool, taggedParticipantId) : null,
    albumId ? getAlbumPhotoIds(albumId) : null,
  ]);

  const albumPhotoIds = albumPhotoIdList ? new Set(albumPhotoIdList) : null;

  let photos = applyFilter(
    gallery.photos,
    gallery.uploaderNames,
    url.searchParams,
    taggedPhotoIds,
  );

  if (albumPhotoIds) {
    photos = photos.filter((p) => albumPhotoIds.has(p.id));
  }

  if (photos.length === 0) {
    return NextResponse.json(
      { error: "No visible photos match this filter." },
      { status: 404 },
    );
  }

  const archive = new ZipArchive({ zlib: { level: 0 } });
  const output = new PassThrough();
  archive.pipe(output);

  const usedNames = new Set<string>();

  void (async () => {
    try {
      for (const [index, photo] of photos.entries()) {
        const uploader = safeFileName(
          gallery.uploaderNames[photo.participantId] ?? "guest",
        );
        const sequence = String(index + 1).padStart(3, "0");
        let name = `${sequence}-${uploader}-${safeFileName(photo.originalFileName)}`;

        while (usedNames.has(name)) {
          name = `_${name}`;
        }
        usedNames.add(name);

        const buffer = await getR2ObjectBuffer(photo.originalKey);
        archive.append(buffer, { name });
      }

      await archive.finalize();
    } catch (error) {
      Sentry.captureException(error);
      archive.destroy(
        error instanceof Error ? error : new Error("Export failed."),
      );
    }
  })();

  // Build a descriptive ZIP name
  const participantId = url.searchParams.get("participantId");
  const date = url.searchParams.get("date");
  const baseName = safeFileName(gallery.event.name) || "event";
  let suffix = "photos";
  if (participantId) {
    const name = safeFileName(gallery.uploaderNames[participantId] ?? "guest");
    suffix = `by_${name}`;
  } else if (date) {
    suffix = `date_${date}`;
  } else if (taggedParticipantId) {
    suffix = `tagged`;
  } else if (albumId) {
    suffix = `album`;
  }
  const zipName = `${baseName}-${suffix}.zip`;

  return new Response(Readable.toWeb(output) as ReadableStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipName}"`,
      "Cache-Control": "no-store",
    },
  });
}
