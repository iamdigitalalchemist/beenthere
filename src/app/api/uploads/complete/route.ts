import { NextResponse } from "next/server";
import { getDatabasePool } from "@/server/db";
import { assertPinAccessForEventId } from "@/server/pin-guard";
import { tasks } from "@trigger.dev/sdk/v3";
import { processUploadedPhoto } from "@/server/photo-jobs";
import { processUploadedVideo } from "@/server/video-jobs";
import { isVideoType } from "@/server/upload-policy";
import { logger } from "@/server/logger";
import * as Sentry from "@sentry/nextjs";

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
      event_participant_id: string;
      original_key: string;
      original_file_name: string;
      original_content_type: string;
      original_size_bytes: number;
      uploaded_at: string;
    }>(
    `select id, event_id, event_participant_id, original_key,
            original_file_name, original_content_type, original_size_bytes, uploaded_at
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

  logger.info("photo_upload_complete", {
    photo_id: photoRow.id,
    event_id: photoRow.event_id,
    participant_id: photoRow.event_participant_id,
    size_bytes: Number(photoRow.original_size_bytes),
    content_type: photoRow.original_content_type,
  });

  const isVideo = isVideoType(photoRow.original_content_type);

  // When Trigger.dev is not configured (local dev), process inline.
  if (!process.env.TRIGGER_SECRET_KEY) {
    try {
      const photo = isVideo
        ? await processUploadedVideo(photoRow.id)
        : await processUploadedPhoto(photoRow.id);
      return NextResponse.json({ photo });
    } catch (err) {
      Sentry.captureException(err, { extra: { photo_id: photoRow.id } });
      logger.error("media_inline_processing_failed", {
        photo_id: photoRow.id,
        is_video: isVideo,
        error: err instanceof Error ? err.message : String(err),
      });
      // Fall through and return the processing state so the client isn't left hanging.
    }
  } else if (isVideo) {
    await tasks.trigger("process-uploaded-video", { photoId: photoRow.id });
  } else {
    await tasks.trigger("process-uploaded-photo", { photoId: photoRow.id });
  }

  return NextResponse.json({
    photo: {
      id: photoRow.id,
      eventId: photoRow.event_id,
      participantId: photoRow.event_participant_id,
      status: "processing",
      visibility: "visible",
      inGallery: false,
      originalKey: photoRow.original_key,
      thumbnailUrl: null,
      previewUrl: null,
      originalFileName: photoRow.original_file_name,
      originalContentType: photoRow.original_content_type,
      originalSizeBytes: Number(photoRow.original_size_bytes),
      mediaType: isVideo ? "video" : "image",
      width: 1,
      height: 1,
      uploadedAt: photoRow.uploaded_at,
    },
  });
}
