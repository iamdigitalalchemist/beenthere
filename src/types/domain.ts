export type EventStatus = "draft" | "active" | "ended" | "expired";

export type EventRole = "owner" | "cohost" | "guest";

export type ParticipantStatus = "active" | "blocked" | "removed";

export type PhotoStatus = "uploading" | "processing" | "ready" | "failed";

export type PhotoVisibility =
  | "visible"
  | "pending_review"
  | "hidden"
  | "reported"
  | "deleted";

export type PhotoReportSummary = {
  count: number;
  reasons: string[];
};

export type EventPlan = "draft" | "event" | "event_plus";

export type EventTemplate =
  | "wedding"
  | "birthday"
  | "corporate"
  | "party"
  | "graduation"
  | "reunion"
  | "conference"
  | "other";

export type EventRecord = {
  id: string;
  publicId: string;
  ownerUserId?: string;
  joinToken: string;
  name: string;
  template: EventTemplate;
  status: EventStatus;
  plan: EventPlan;
  startsAt: string;
  endsAt: string;
  uploadClosesAt: string;
  galleryExpiresAt: string;
  language: "en" | "de";
  welcomeMessage: string;
  pinEnabled: boolean;
  collectSocials: boolean;
  storageLimitBytes: number;
  storageUsedBytes: number;
};

export type GuestSocialHandles = {
  instagram?: string;
  facebook?: string;
  x?: string;
  tiktok?: string;
};

export type EventParticipant = {
  id: string;
  eventId: string;
  userId?: string;
  role: EventRole;
  displayName: string;
  status: ParticipantStatus;
  consentUploadedAt?: string;
  consentVersion?: string;
  profilePhotoUrl?: string;
  socialHandles?: GuestSocialHandles;
};

export type PhotoTag = {
  participantId: string;
  displayName: string;
  taggedByParticipantId: string;
};

export type PhotoRecord = {
  id: string;
  eventId: string;
  participantId: string;
  status: PhotoStatus;
  visibility: PhotoVisibility;
  originalKey: string;
  thumbnailUrl: string;
  previewUrl: string;
  originalFileName: string;
  originalContentType: string;
  originalSizeBytes: number;
  width: number;
  height: number;
  uploadedAt: string;
  takenAt?: string;
};

export type SmartAlbumType = "by_uploader" | "by_date" | "by_tag";

export type SmartAlbum = {
  id: string;
  type: SmartAlbumType;
  label: string;
  photoCount: number;
  coverThumbnailUrl: string;
  filterKey: string;
  filterValue: string;
};

export type CustomAlbum = {
  id: string;
  name: string;
  photoCount: number;
  coverThumbnailUrl: string;
  createdAt: string;
};

export type UploadReservationRequest = {
  eventId: string;
  participantId: string;
  files: Array<{
    name: string;
    size: number;
    type: string;
  }>;
};

export type UploadReservation = {
  photoId: string;
  fileIndex: number;
  fileName: string;
  uploadUrl: string;
  method: "PUT";
  objectKey: string;
  headers: Record<string, string>;
};
