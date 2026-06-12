import { createPhotoDerivatives } from "@/server/photo-processing";
import { getDatabasePool } from "@/server/db";
import { createLocalMediaKey, isLocalMediaKey } from "@/server/local-media";
import {
  createSignedPhotoReadUrl,
  getR2ObjectBuffer,
  putR2Object,
} from "@/server/r2";
import { createPhotoDerivativeKeys } from "@/server/storage-paths";
import type { PhotoRecord } from "@/types/domain";

type PhotoJobRow = {
  id: string;
  event_id: string;
  event_participant_id: string;
  original_key: string;
  original_file_name: string;
  original_content_type: string;
  original_size_bytes: number;
};

function toIsoString(value: string | Date) {
  return value instanceof Date ? value.toISOString() : value;
}

function toNumber(value: string | number) {
  return typeof value === "string" ? Number(value) : value;
}

export async function processUploadedPhoto(photoId: string): Promise<PhotoRecord> {
  const pool = getDatabasePool();

  if (!pool) {
    throw new Error("POSTGRES_URL is not configured.");
  }

  const photoResult = await pool.query<PhotoJobRow>(
    `select id, event_id, event_participant_id, original_key,
            original_file_name, original_content_type, original_size_bytes
       from beenthere.photos
      where id = $1
      limit 1`,
    [photoId],
  );
  const photoRow = photoResult.rows[0];

  if (!photoRow) {
    throw new Error("Photo not found.");
  }

  await pool.query(
    `update beenthere.photos set status = 'processing' where id = $1`,
    [photoId],
  );

  const original = await getR2ObjectBuffer(photoRow.original_key);
  const derivatives = await createPhotoDerivatives(original);
  const derivativeKeys = createPhotoDerivativeKeys({
    eventId: photoRow.event_id,
    photoId: photoRow.id,
  });
  const thumbnailKey = isLocalMediaKey(photoRow.original_key)
    ? createLocalMediaKey(derivativeKeys.thumbnailKey)
    : derivativeKeys.thumbnailKey;
  const previewKey = isLocalMediaKey(photoRow.original_key)
    ? createLocalMediaKey(derivativeKeys.previewKey)
    : derivativeKeys.previewKey;

  await Promise.all([
    putR2Object({
      objectKey: thumbnailKey,
      body: derivatives.thumbnail,
      contentType: "image/jpeg",
    }),
    putR2Object({
      objectKey: previewKey,
      body: derivatives.preview,
      contentType: "image/jpeg",
    }),
  ]);

  const updateResult = await pool.query<{
      id: string;
      event_id: string;
      event_participant_id: string;
      status: PhotoRecord["status"];
      visibility: PhotoRecord["visibility"];
      original_key: string;
      original_file_name: string;
      original_content_type: string;
      original_size_bytes: number;
      width: number | null;
      height: number | null;
      uploaded_at: string;
      taken_at: string | null;
    }>(
    `update beenthere.photos
        set status = 'ready',
            thumbnail_key = $2,
            preview_key = $3,
            width = $4,
            height = $5
      where id = $1
      returning id, event_id, event_participant_id, status, visibility,
                original_key, original_file_name, original_content_type,
                original_size_bytes, width, height, uploaded_at, taken_at`,
    [photoId, thumbnailKey, previewKey, derivatives.width, derivatives.height],
  );
  const updatedPhoto = updateResult.rows[0];

  if (!updatedPhoto) {
    throw new Error("Failed to update photo.");
  }

  const [thumbnailUrl, previewUrl] = await Promise.all([
    createSignedPhotoReadUrl(thumbnailKey),
    createSignedPhotoReadUrl(previewKey),
  ]);

  return {
    id: updatedPhoto.id,
    eventId: updatedPhoto.event_id,
    participantId: updatedPhoto.event_participant_id,
    status: updatedPhoto.status,
    visibility: updatedPhoto.visibility,
    originalKey: updatedPhoto.original_key,
    thumbnailUrl,
    previewUrl,
    originalFileName: updatedPhoto.original_file_name,
    originalContentType: updatedPhoto.original_content_type,
    originalSizeBytes: toNumber(updatedPhoto.original_size_bytes),
    width: updatedPhoto.width ?? 1,
    height: updatedPhoto.height ?? 1,
    uploadedAt: toIsoString(updatedPhoto.uploaded_at),
    takenAt: updatedPhoto.taken_at
      ? toIsoString(updatedPhoto.taken_at)
      : undefined,
  };
}
