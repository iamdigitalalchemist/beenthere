const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
]);

export const MAX_UPLOAD_BATCH_SIZE = 100;
export const EVENT_PLAN_STORAGE_BYTES = {
  event: 25 * 1024 * 1024 * 1024,
  event_plus: 100 * 1024 * 1024 * 1024,
};

export function validateUploadBatch(
  files: Array<{ name: string; size: number; type: string }>,
) {
  if (files.length === 0) {
    return "Select at least one photo.";
  }

  if (files.length > MAX_UPLOAD_BATCH_SIZE) {
    return `Upload up to ${MAX_UPLOAD_BATCH_SIZE} photos per batch.`;
  }

  const unsupportedFile = files.find(
    (file) => !SUPPORTED_IMAGE_TYPES.has(file.type),
  );

  if (unsupportedFile) {
    return `${unsupportedFile.name} is not a supported photo type.`;
  }

  const emptyFile = files.find((file) => file.size <= 0);

  if (emptyFile) {
    return `${emptyFile.name} appears to be empty.`;
  }

  return undefined;
}
