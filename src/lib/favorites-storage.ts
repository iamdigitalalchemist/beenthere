export function getFavoritesStorageKey(eventId: string, participantId?: string) {
  if (participantId) {
    return `beenthere:${eventId}:favorites:${participantId}`;
  }

  return `beenthere:${eventId}:favorites`;
}

export function readStoredFavoriteIds(eventId: string, participantId?: string) {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(
    getFavoritesStorageKey(eventId, participantId),
  );

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

export function writeStoredFavoriteIds(
  eventId: string,
  photoIds: string[],
  participantId?: string,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    getFavoritesStorageKey(eventId, participantId),
    JSON.stringify(photoIds),
  );
}
