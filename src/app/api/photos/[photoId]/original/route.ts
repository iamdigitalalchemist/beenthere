import { NextResponse } from "next/server";
import { getDatabasePool } from "@/server/db";
import { assertPinAccessForEventId } from "@/server/pin-guard";
import { createSignedPhotoReadUrl } from "@/server/r2";
import { isLocalMediaKey } from "@/server/local-media";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ photoId: string }> },
) {
  try {
    const { photoId } = await params;
    const pool = getDatabasePool();

    if (!pool) {
      return NextResponse.json({ error: "POSTGRES_URL is not configured." }, { status: 501 });
    }

    const result = await pool.query<{
      event_id: string;
      original_key: string;
      playback_key: string | null;
      media_type: string;
      visibility: string;
    }>(
      `select event_id, original_key, playback_key, media_type, visibility
         from beenthere.photos
        where id = $1
        limit 1`,
      [photoId],
    );

    const row = result.rows[0];

    if (!row || row.visibility === "deleted") {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    if (row.media_type !== "video") {
      return NextResponse.json({ error: "Not a video." }, { status: 400 });
    }

    const pinDenied = await assertPinAccessForEventId(row.event_id);
    if (pinDenied) return pinDenied;

    const serveKey = row.playback_key ?? row.original_key;

    // Local dev: relative URLs can't be used with redirect — build absolute URL from request.
    if (isLocalMediaKey(serveKey)) {
      const origin = new URL(request.url).origin;
      const localUrl = `${origin}/${serveKey}`;
      return NextResponse.redirect(localUrl, { status: 302 });
    }

    const url = await createSignedPhotoReadUrl(serveKey);
    return NextResponse.redirect(url, { status: 302 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
