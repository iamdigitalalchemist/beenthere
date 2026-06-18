import type { EventRecord, PhotoRecord } from "@/types/domain";

let demoPinHash: string | null = null;

export const DEMO_EVENT: EventRecord = {
  id: "evt_demo_001",
  publicId: "demo-event",
  joinToken: "demo-join-token",
  name: "Friends & Family Test",
  template: "party",
  status: "active",
  plan: "event",
  startsAt: "2026-06-06T18:00:00.000Z",
  endsAt: "2026-06-06T23:00:00.000Z",
  uploadClosesAt: "2026-06-08T23:00:00.000Z",
  galleryExpiresAt: "2026-08-05T23:00:00.000Z",
  language: "en",
  welcomeMessage:
    "Scan in, see everyone&apos;s photos, and add your own favorite moments.",
  pinEnabled: false,
  collectSocials: false,
  storageLimitBytes: 25 * 1024 * 1024 * 1024,
  storageUsedBytes: 148 * 1024 * 1024,
  uploadPolicy: "open" as const,
};

export const DEMO_PHOTOS: PhotoRecord[] = [
  {
    id: "photo_demo_001",
    eventId: DEMO_EVENT.id,
    participantId: "participant_demo_001",
    status: "ready",
    visibility: "visible",
    inGallery: true,
    originalKey: "demo/originals/photo-001.jpg",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=480&q=75",
    previewUrl:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=2048&q=82",
    originalFileName: "welcome-table.jpg",
    originalContentType: "image/jpeg",
    originalSizeBytes: 3_400_000,
    width: 1600,
    height: 1067,
    uploadedAt: "2026-06-06T18:12:00.000Z",
  },
  {
    id: "photo_demo_002",
    eventId: DEMO_EVENT.id,
    participantId: "participant_demo_002",
    status: "ready",
    visibility: "visible",
    inGallery: true,
    originalKey: "demo/originals/photo-002.jpg",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=480&q=75",
    previewUrl:
      "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=2048&q=82",
    originalFileName: "toast.jpg",
    originalContentType: "image/jpeg",
    originalSizeBytes: 4_100_000,
    width: 1600,
    height: 2400,
    uploadedAt: "2026-06-06T18:22:00.000Z",
  },
  {
    id: "photo_demo_003",
    eventId: DEMO_EVENT.id,
    participantId: "participant_demo_003",
    status: "ready",
    visibility: "visible",
    inGallery: true,
    originalKey: "demo/originals/photo-003.jpg",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=480&q=75",
    previewUrl:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=2048&q=82",
    originalFileName: "dance-floor.jpg",
    originalContentType: "image/jpeg",
    originalSizeBytes: 4_800_000,
    width: 1800,
    height: 1200,
    uploadedAt: "2026-06-06T19:04:00.000Z",
  },
];

export const DEMO_UPLOADER_NAMES: Record<string, string> = {
  participant_demo_001: "Mia",
  participant_demo_002: "Jonas",
  participant_demo_003: "Amira",
};

export function getDemoPinHash() {
  return demoPinHash;
}

export function setDemoPinHash(pinHash: string | null) {
  demoPinHash = pinHash;
}

function withDemoPinState(event: EventRecord): EventRecord {
  const pinEnabled = Boolean(demoPinHash);

  if (event.pinEnabled === pinEnabled) {
    return event;
  }

  return {
    ...event,
    pinEnabled,
  };
}

export function getDemoEventByToken(token: string) {
  return token === DEMO_EVENT.joinToken
    ? withDemoPinState(DEMO_EVENT)
    : undefined;
}

export function getDemoEventByPublicId(publicId: string) {
  return publicId === DEMO_EVENT.publicId
    ? withDemoPinState(DEMO_EVENT)
    : undefined;
}
