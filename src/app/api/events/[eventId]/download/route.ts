import { PassThrough, Readable } from "node:stream";
import { NextResponse } from "next/server";
import { ZipArchive } from "archiver";
import { getEventGallery } from "@/server/data";
import { getDatabasePool } from "@/server/db";
import { getR2ObjectBuffer } from "@/server/r2";
import { assertPinAccessForPublicId } from "@/server/pin-guard";

type RouteProps = { params: Promise<{ eventId: string }> };

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

export async function GET(request: Request, { params }: RouteProps) {
  if (!getDatabasePool()) {
    return NextResponse.json(
      { error: "Downloads require a configured database." },
      { status: 501 },
    );
  }

  const { eventId: publicId } = await params;

  const pinDenied = await assertPinAccessForPublicId(publicId);
  if (pinDenied) return pinDenied;

  const gallery = await getEventGallery(publicId);
  if (!gallery) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const url = new URL(request.url);
  const requestedIds = new Set(url.searchParams.getAll("photoId"));

  if (requestedIds.size === 0) {
    return NextResponse.json({ error: "No photoId params provided." }, { status: 400 });
  }

  if (requestedIds.size > 500) {
    return NextResponse.json({ error: "Too many photos requested." }, { status: 400 });
  }

  // Only allow visible, ready photos that belong to this event.
  const photos = gallery.photos.filter(
    (p) => requestedIds.has(p.id) && p.status === "ready" && p.visibility === "visible",
  );

  if (photos.length === 0) {
    return NextResponse.json({ error: "No downloadable photos found." }, { status: 404 });
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
        while (usedNames.has(name)) name = `_${name}`;
        usedNames.add(name);
        const buffer = await getR2ObjectBuffer(photo.originalKey);
        archive.append(buffer, { name });
      }
      await archive.finalize();
    } catch (error) {
      archive.destroy(
        error instanceof Error ? error : new Error("Download failed."),
      );
    }
  })();

  const zipName = `${safeFileName(gallery.event.name) || "photos"}-selection.zip`;

  return new Response(Readable.toWeb(output) as ReadableStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipName}"`,
      "Cache-Control": "no-store",
    },
  });
}
