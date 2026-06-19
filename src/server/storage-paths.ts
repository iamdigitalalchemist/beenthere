const SAFE_FILE_NAME_PATTERN = /[^a-zA-Z0-9._-]+/g;

export function createOriginalPhotoKey(input: {
  eventId: string;
  photoId: string;
  fileName: string;
}) {
  const safeFileName = input.fileName
    .replace(SAFE_FILE_NAME_PATTERN, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `events/${input.eventId}/originals/${input.photoId}/${safeFileName || "upload"}`;
}

export function createPhotoDerivativeKeys(input: {
  eventId: string;
  photoId: string;
}) {
  const baseKey = `events/${input.eventId}/derivatives/${input.photoId}`;

  return {
    thumbnailKey: `${baseKey}/thumb-480.jpg`,
    previewKey: `${baseKey}/preview-2048.jpg`,
  };
}

export function createVideoDerivativeKeys(input: {
  eventId: string;
  photoId: string;
}) {
  const baseKey = `events/${input.eventId}/derivatives/${input.photoId}`;

  return {
    posterKey: `${baseKey}/poster.jpg`,
    playbackKey: `${baseKey}/playback.mp4`,
  };
}
