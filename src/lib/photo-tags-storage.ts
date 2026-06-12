import type { PhotoTag } from "@/types/domain";

export function readStoredPhotoTags(photoId: string) {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(`beenthere:photo-tags:${photoId}`);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as PhotoTag[]) : [];
  } catch {
    return [];
  }
}

export function writeStoredPhotoTags(photoId: string, tags: PhotoTag[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    `beenthere:photo-tags:${photoId}`,
    JSON.stringify(tags),
  );
}
