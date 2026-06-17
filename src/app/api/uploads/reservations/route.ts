import { NextResponse } from "next/server";
import { getDatabasePool } from "@/server/db";
import { assertPinAccessForEventId } from "@/server/pin-guard";
import { getR2Env, isLocalUploadStorageEnabled } from "@/server/env";
import { createLocalMediaKey } from "@/server/local-media";
import { createSignedPhotoUploadUrl } from "@/server/r2";
import { createOriginalPhotoKey } from "@/server/storage-paths";
import { validateUploadBatch } from "@/server/upload-policy";
import { logger } from "@/server/logger";
import * as Sentry from "@sentry/nextjs";
import type {
  UploadReservation,
  UploadReservationRequest,
} from "@/types/domain";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<UploadReservationRequest>;

  if (!body.eventId || !body.participantId || !Array.isArray(body.files)) {
    return NextResponse.json(
      { error: "eventId, participantId, and files are required." },
      { status: 400 },
    );
  }

  const pinDenied = await assertPinAccessForEventId(body.eventId);

  if (pinDenied) {
    return pinDenied;
  }

  const validationError = validateUploadBatch(body.files);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const r2Env = getR2Env();
  const useLocalStorage = !r2Env.configured && isLocalUploadStorageEnabled();

  if (!r2Env.configured && !useLocalStorage) {
    return NextResponse.json(
      {
        error:
          "R2 is not configured. Set LOCAL_UPLOADS_ENABLED=true for local development uploads.",
        missing: r2Env.missing,
      },
      { status: 501 },
    );
  }

  const pool = getDatabasePool();

  if (!pool) {
    return NextResponse.json(
      { error: "POSTGRES_URL is not configured." },
      { status: 501 },
    );
  }

  const eventResult = await pool.query<{
      id: string;
      storage_limit_bytes: number;
      storage_used_bytes: number;
    }>(
    `select id, storage_limit_bytes, storage_used_bytes
       from beenthere.events
      where id = $1
      limit 1`,
    [body.eventId],
  );
  const eventRow = eventResult.rows[0];

  if (!eventRow) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  let remainingBytes =
    eventRow.storage_limit_bytes - eventRow.storage_used_bytes;
  const acceptedFiles: Array<{
    fileIndex: number;
    name: string;
    size: number;
    type: string;
  }> = [];
  const skippedFiles: Array<{ fileIndex: number; name: string; reason: string }> =
    [];

  body.files.forEach((file, fileIndex) => {
    if (file.size <= remainingBytes) {
      acceptedFiles.push({ ...file, fileIndex });
      remainingBytes -= file.size;
    } else {
      skippedFiles.push({
        fileIndex,
        name: file.name,
        reason: "Event storage limit reached.",
      });
    }
  });

  if (acceptedFiles.length === 0) {
    return NextResponse.json(
      {
        error: "This event does not have enough remaining storage.",
        skippedFiles,
      },
      { status: 409 },
    );
  }

  const reservations: UploadReservation[] = await Promise.all(
    acceptedFiles.map(async (file) => {
      const photoId = crypto.randomUUID();
      const baseObjectKey = createOriginalPhotoKey({
        eventId: body.eventId!,
        photoId,
        fileName: file.name,
      });
      const objectKey = useLocalStorage
        ? createLocalMediaKey(baseObjectKey)
        : baseObjectKey;
      const uploadUrl = useLocalStorage
        ? `/api/uploads/local?photoId=${photoId}&objectKey=${encodeURIComponent(
            objectKey,
          )}`
        : await createSignedPhotoUploadUrl({
            objectKey,
            contentType: file.type,
          });

      return {
        photoId,
        fileIndex: file.fileIndex,
        fileName: file.name,
        uploadUrl,
        method: "PUT",
        objectKey,
        headers: {
          "Content-Type": file.type,
        },
      };
    }),
  );

  const client = await pool.connect();

  try {
    await client.query("begin");

    for (const reservation of reservations) {
      const file = acceptedFiles.find(
        (acceptedFile) => acceptedFile.fileIndex === reservation.fileIndex,
      )!;

      await client.query(
        `insert into beenthere.photos (
            id, event_id, event_participant_id, status, visibility, original_key,
            original_file_name, original_content_type, original_size_bytes
          )
          values ($1, $2, $3, 'uploading', 'visible', $4, $5, $6, $7)`,
        [
          reservation.photoId,
          body.eventId,
          body.participantId,
          reservation.objectKey,
          file.name,
          file.type,
          file.size,
        ],
      );

      await client.query(
        `insert into beenthere.upload_reservations (
            event_id, event_participant_id, photo_id, reserved_bytes, status,
            expires_at
          )
          values ($1, $2, $3, $4, 'reserved', now() + interval '1 hour')`,
        [body.eventId, body.participantId, reservation.photoId, file.size],
      );
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    Sentry.captureException(error);
    logger.error("upload_reservation_failed", {
      event_id: body.eventId,
      participant_id: body.participantId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Reservation failed." },
      { status: 500 },
    );
  } finally {
    client.release();
  }

  logger.info("upload_reserved", {
    event_id: body.eventId,
    participant_id: body.participantId,
    accepted_count: reservations.length,
    skipped_count: skippedFiles.length,
  });

  return NextResponse.json({
    reservations,
    skippedFiles,
    nextStep:
      "Upload each file with PUT, then mark the photo uploaded and enqueue photo.process.",
  });
}
