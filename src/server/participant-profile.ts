import sharp from "sharp";
import { getR2Env, isLocalUploadStorageEnabled } from "@/server/env";
import {
  createLocalMediaKey,
  createLocalMediaUrl,
  isLocalMediaKey,
  readLocalMediaBuffer,
  writeLocalMediaBuffer,
} from "@/server/local-media";
import { getR2ObjectBuffer, putR2Object } from "@/server/r2";

const PROFILE_PHOTO_SIZE = 256;

export function createProfilePhotoObjectKey(input: {
  eventId: string;
  participantId: string;
}) {
  return `profiles/${input.eventId}/${input.participantId}.jpg`;
}

export async function resolveProfilePhotoUrl(objectKey: string | null | undefined) {
  if (!objectKey) {
    return undefined;
  }

  if (isLocalMediaKey(objectKey)) {
    return createLocalMediaUrl(objectKey);
  }

  const { createSignedPhotoReadUrl } = await import("@/server/r2");
  return createSignedPhotoReadUrl(objectKey);
}

export async function processProfilePhotoBuffer(buffer: Buffer) {
  return sharp(buffer)
    .rotate()
    .resize(PROFILE_PHOTO_SIZE, PROFILE_PHOTO_SIZE, {
      fit: "cover",
      position: "centre",
    })
    .jpeg({ quality: 82 })
    .toBuffer();
}

export async function storeProfilePhoto(input: {
  objectKey: string;
  body: Buffer;
}) {
  const processed = await processProfilePhotoBuffer(input.body);
  const r2Env = getR2Env();
  const useLocalStorage = !r2Env.configured && isLocalUploadStorageEnabled();

  if (useLocalStorage) {
    const localKey = isLocalMediaKey(input.objectKey)
      ? input.objectKey
      : createLocalMediaKey(input.objectKey);

    await writeLocalMediaBuffer({
      objectKey: localKey,
      body: processed,
    });

    return localKey;
  }

  await putR2Object({
    objectKey: input.objectKey,
    body: processed,
    contentType: "image/jpeg",
  });

  return input.objectKey;
}

export async function readUploadedProfilePhotoBuffer(objectKey: string) {
  if (isLocalMediaKey(objectKey)) {
    return readLocalMediaBuffer(objectKey);
  }

  return getR2ObjectBuffer(objectKey);
}
