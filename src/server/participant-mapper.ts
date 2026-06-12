import { resolveProfilePhotoUrl } from "@/server/participant-profile";
import type { EventParticipant } from "@/types/domain";

export type ParticipantRow = {
  id: string;
  event_id: string;
  user_id: string | null;
  role: EventParticipant["role"];
  display_name: string;
  status: EventParticipant["status"];
  consent_uploaded_at: string | Date | null;
  consent_version: string | null;
  profile_photo_key?: string | null;
  instagram_handle?: string | null;
  facebook_handle?: string | null;
  x_handle?: string | null;
  tiktok_handle?: string | null;
};

export const PARTICIPANT_BASE_RETURNING_FIELDS = `id, event_id, user_id, role, display_name, status,
            consent_uploaded_at, consent_version`;

export const PARTICIPANT_PROFILE_RETURNING_FIELDS = `profile_photo_key,
            instagram_handle, facebook_handle, x_handle, tiktok_handle`;

export const PARTICIPANT_RETURNING_FIELDS = `${PARTICIPANT_BASE_RETURNING_FIELDS}, ${PARTICIPANT_PROFILE_RETURNING_FIELDS}`;

export const PARTICIPANT_BASE_SELECT_FIELDS =
  PARTICIPANT_BASE_RETURNING_FIELDS.replace(/(^|,\s*)([a-z_]+)/g, "$1ep.$2");

export const PARTICIPANT_SELECT_FIELDS = PARTICIPANT_RETURNING_FIELDS.replace(
  /(^|,\s*)([a-z_]+)/g,
  "$1ep.$2",
);

export function isMissingParticipantColumnError(error: unknown) {
  return (
    error instanceof Error &&
    /column "(profile_photo_key|instagram_handle|facebook_handle|x_handle|tiktok_handle|recovery_code_hash)" of relation "event_participants" does not exist/.test(
      error.message,
    )
  );
}

export async function mapParticipantRow(
  row: ParticipantRow,
): Promise<EventParticipant> {
  const socialHandles = {
    instagram: row.instagram_handle ?? undefined,
    facebook: row.facebook_handle ?? undefined,
    x: row.x_handle ?? undefined,
    tiktok: row.tiktok_handle ?? undefined,
  };

  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id ?? undefined,
    role: row.role,
    displayName: row.display_name,
    status: row.status,
    consentUploadedAt: row.consent_uploaded_at
      ? row.consent_uploaded_at instanceof Date
        ? row.consent_uploaded_at.toISOString()
        : row.consent_uploaded_at
      : undefined,
    consentVersion: row.consent_version ?? undefined,
    profilePhotoUrl: await resolveProfilePhotoUrl(row.profile_photo_key),
    socialHandles: Object.values(socialHandles).some(Boolean)
      ? socialHandles
      : undefined,
  };
}
