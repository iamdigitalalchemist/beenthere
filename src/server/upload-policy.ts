const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
]);

export const SUPPORTED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

export function isVideoType(contentType: string): boolean {
  return SUPPORTED_VIDEO_TYPES.has(contentType);
}

export const MAX_UPLOAD_BATCH_SIZE = 100;
export const EVENT_PLAN_STORAGE_BYTES = {
  event: 25 * 1024 * 1024 * 1024,
  event_plus: 100 * 1024 * 1024 * 1024,
};

export function validateUploadBatch(
  files: Array<{ name: string; size: number; type: string }>,
) {
  if (files.length === 0) {
    return "Select at least one photo or video.";
  }

  if (files.length > MAX_UPLOAD_BATCH_SIZE) {
    return `Upload up to ${MAX_UPLOAD_BATCH_SIZE} files per batch.`;
  }

  const unsupportedFile = files.find(
    (file) => !SUPPORTED_IMAGE_TYPES.has(file.type) && !SUPPORTED_VIDEO_TYPES.has(file.type),
  );

  if (unsupportedFile) {
    return `${unsupportedFile.name} is not a supported photo or video type.`;
  }

  const emptyFile = files.find((file) => file.size <= 0);

  if (emptyFile) {
    return `${emptyFile.name} appears to be empty.`;
  }

  return undefined;
}
