import { PassThrough, Readable } from "node:stream";
import { NextResponse } from "next/server";
import { ZipArchive } from "archiver";
import { getHostUserForApi } from "@/server/auth";
import { getEventGallery } from "@/server/data";
import { getDatabasePool } from "@/server/db";
import { getR2ObjectBuffer } from "@/server/r2";

type EventExportRouteProps = {
  params: Promise<{
    eventId: string;
  }>;
};

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

export async function GET(_request: Request, { params }: EventExportRouteProps) {
  const host = await getHostUserForApi();

  if (!host.ok) {
    return NextResponse.json({ error: host.error }, { status: host.status });
  }

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

  const photos = gallery.photos.filter(
    (photo) => photo.status === "ready" && photo.visibility === "visible",
  );

  if (photos.length === 0) {
    return NextResponse.json(
      { error: "No visible photos to export yet." },
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
      archive.destroy(
        error instanceof Error ? error : new Error("Export failed."),
      );
    }
  })();

  const zipName = `${safeFileName(gallery.event.name) || "event"}-photos.zip`;

  return new Response(Readable.toWeb(output) as ReadableStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipName}"`,
      "Cache-Control": "no-store",
    },
  });
}
