import { NextResponse } from "next/server";
import { getDatabasePool } from "@/server/db";
import { processUploadedPhoto } from "@/server/photo-jobs";
import { assertPinAccessForEventId } from "@/server/pin-guard";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<{
    photoId: string;
    objectKey: string;
  }>;

  if (!body.photoId || !body.objectKey) {
    return NextResponse.json(
      { error: "photoId and objectKey are required." },
      { status: 400 },
    );
  }

  const pool = getDatabasePool();

  if (!pool) {
    return NextResponse.json(
      { error: "POSTGRES_URL is not configured." },
      { status: 501 },
    );
  }

  const photoResult = await pool.query<{
      id: string;
      event_id: string;
      original_key: string;
      original_size_bytes: number;
    }>(
    `select id, event_id, original_key, original_size_bytes
       from beenthere.photos
      where id = $1 and original_key = $2
      limit 1`,
    [body.photoId, body.objectKey],
  );
  const photoRow = photoResult.rows[0];

  if (!photoRow) {
    return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  }

  const pinDenied = await assertPinAccessForEventId(photoRow.event_id);

  if (pinDenied) {
    return pinDenied;
  }

  await pool.query(
    `update beenthere.upload_reservations
        set status = 'finalized',
            finalized_bytes = $1
      where photo_id = $2`,
    [photoRow.original_size_bytes, photoRow.id],
  );

  await pool.query(`select beenthere.increment_event_storage($1, $2)`, [
    photoRow.event_id,
    photoRow.original_size_bytes,
  ]);

  const photo = await processUploadedPhoto(photoRow.id);

  return NextResponse.json({ photo });
}
