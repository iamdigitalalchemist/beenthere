import {
  DEMO_EVENT,
  DEMO_PHOTOS,
  DEMO_UPLOADER_NAMES,
  getDemoEventByPublicId,
  getDemoEventByToken,
  getDemoPinHash,
  setDemoPinHash,
} from "@/lib/demo-data";
import { randomBytes } from "node:crypto";
import { sha256Hex } from "@/server/crypto";
import { normalizeEventPin } from "@/server/pin-policy";
import { getDatabasePool } from "@/server/db";
import { getEventPhotoReports } from "@/server/photo-reports";
import { getSmartAlbums } from "@/server/smart-albums";
import { getCustomAlbums } from "@/server/custom-albums";
import { createSignedPhotoReadUrl } from "@/server/r2";
import { logger } from "@/server/logger";
import type {
  EventParticipant,
  EventRecord,
  EventTemplate,
  PhotoRecord,
  PhotoVisibility,
} from "@/types/domain";

type EventRow = {
  id: string;
  public_id: string;
  owner_user_id: string | null;
  join_token: string | null;
  name: string;
  template: string;
  status: EventRecord["status"];
  plan: EventRecord["plan"];
  starts_at: string;
  ends_at: string;
  upload_closes_at: string;
  gallery_expires_at: string;
  language: "en" | "de";
  welcome_message: string;
  pin_hash: string | null;
  collect_socials: boolean;
  storage_limit_bytes: number;
  storage_used_bytes: number;
};

type PhotoRow = {
  id: string;
  event_id: string;
  event_participant_id: string;
  status: PhotoRecord["status"];
  visibility: PhotoRecord["visibility"];
  in_gallery: boolean;
  original_key: string;
  thumbnail_key: string | null;
  preview_key: string | null;
  original_file_name: string;
  original_content_type: string;
  original_size_bytes: number;
  width: number | null;
  height: number | null;
  uploaded_at: string;
  taken_at: string | null;
  event_participants?: {
    display_name: string;
  } | null;
};

function toIsoString(value: string | Date) {
  return value instanceof Date ? value.toISOString() : value;
}

function toNumber(value: string | number) {
  return typeof value === "string" ? Number(value) : value;
}

function mapEventRow(row: EventRow): EventRecord {
  return {
    id: row.id,
    publicId: row.public_id,
    ownerUserId: row.owner_user_id ?? undefined,
    joinToken: row.join_token ?? "",
    name: row.name,
    template: row.template as EventTemplate,
    status: row.status,
    plan: row.plan,
    startsAt: toIsoString(row.starts_at),
    endsAt: toIsoString(row.ends_at),
    uploadClosesAt: toIsoString(row.upload_closes_at),
    galleryExpiresAt: toIsoString(row.gallery_expires_at),
    language: row.language,
    welcomeMessage: row.welcome_message,
    pinEnabled: Boolean(row.pin_hash),
    collectSocials: Boolean(row.collect_socials),
    storageLimitBytes: toNumber(row.storage_limit_bytes),
    storageUsedBytes: toNumber(row.storage_used_bytes),
  };
}

async function mapPhotoRow(row: PhotoRow): Promise<PhotoRecord> {
  const [thumbnailUrl, previewUrl] = await Promise.all([
    row.thumbnail_key ? createSignedPhotoReadUrl(row.thumbnail_key) : "",
    row.preview_key ? createSignedPhotoReadUrl(row.preview_key) : "",
  ]);

  return {
    id: row.id,
    eventId: row.event_id,
    participantId: row.event_participant_id,
    status: row.status,
    visibility: row.visibility,
    inGallery: row.in_gallery,
    originalKey: row.original_key,
    thumbnailUrl,
    previewUrl,
    originalFileName: row.original_file_name,
    originalContentType: row.original_content_type,
    originalSizeBytes: toNumber(row.original_size_bytes),
    width: row.width ?? 1,
    height: row.height ?? 1,
    uploadedAt: toIsoString(row.uploaded_at),
    takenAt: row.taken_at ? toIsoString(row.taken_at) : undefined,
  };
}

type EventAccessPolicy = {
  eventId: string;
  publicId: string;
  pinEnabled: boolean;
  pinHash: string | null;
};

async function getEventAccessPolicyFromRow(
  row: Pick<EventRow, "id" | "public_id" | "pin_hash">,
): Promise<EventAccessPolicy> {
  return {
    eventId: row.id,
    publicId: row.public_id,
    pinEnabled: Boolean(row.pin_hash),
    pinHash: row.pin_hash,
  };
}

export async function getEventAccessPolicyByPublicId(
  publicId: string,
): Promise<EventAccessPolicy | undefined> {
  const pool = getDatabasePool();

  if (!pool) {
    const event = getDemoEventByPublicId(publicId);

    if (!event) {
      return undefined;
    }

    const pinHash = getDemoPinHash();

    return {
      eventId: event.id,
      publicId: event.publicId,
      pinEnabled: Boolean(pinHash),
      pinHash,
    };
  }

  const { rows } = await pool.query<Pick<EventRow, "id" | "public_id" | "pin_hash">>(
    `select id, public_id, pin_hash
       from beenthere.events
      where public_id = $1
      limit 1`,
    [publicId],
  );
  const row = rows[0];

  if (!row) {
    const event = getDemoEventByPublicId(publicId);

    if (!event) {
      return undefined;
    }

    const pinHash = getDemoPinHash();

    return {
      eventId: event.id,
      publicId: event.publicId,
      pinEnabled: Boolean(pinHash),
      pinHash,
    };
  }

  return getEventAccessPolicyFromRow(row);
}

export async function getEventAccessPolicyById(
  eventId: string,
): Promise<EventAccessPolicy | undefined> {
  const pool = getDatabasePool();

  if (!pool) {
    if (eventId !== DEMO_EVENT.id) {
      return undefined;
    }

    const pinHash = getDemoPinHash();

    return {
      eventId: DEMO_EVENT.id,
      publicId: DEMO_EVENT.publicId,
      pinEnabled: Boolean(pinHash),
      pinHash,
    };
  }

  const { rows } = await pool.query<Pick<EventRow, "id" | "public_id" | "pin_hash">>(
    `select id, public_id, pin_hash
       from beenthere.events
      where id = $1
      limit 1`,
    [eventId],
  );
  const row = rows[0];

  if (!row) {
    if (eventId !== DEMO_EVENT.id) {
      return undefined;
    }

    const pinHash = getDemoPinHash();

    return {
      eventId: DEMO_EVENT.id,
      publicId: DEMO_EVENT.publicId,
      pinEnabled: Boolean(pinHash),
      pinHash,
    };
  }

  return getEventAccessPolicyFromRow(row);
}

export async function verifyEventPin(publicId: string, pin: string) {
  const policy = await getEventAccessPolicyByPublicId(publicId);

  if (!policy?.pinEnabled || !policy.pinHash) {
    return true;
  }

  return sha256Hex(normalizeEventPin(pin)) === policy.pinHash;
}

export async function updateEventPin(publicId: string, pin: string | null) {
  const pool = getDatabasePool();
  const pinHash = pin ? sha256Hex(pin) : null;

  if (!pool) {
    const event = getDemoEventByPublicId(publicId);

    if (!event) {
      throw new Error("Event not found.");
    }

    setDemoPinHash(pinHash);

    return {
      pinEnabled: Boolean(pinHash),
    };
  }

  const { rows } = await pool.query<{ id: string }>(
    `update beenthere.events
        set pin_hash = $2,
            updated_at = now()
      where public_id = $1
      returning id`,
    [publicId, pinHash],
  );

  if (!rows[0]) {
    const event = getDemoEventByPublicId(publicId);

    if (!event) {
      throw new Error("Event not found.");
    }

    setDemoPinHash(pinHash);

    return {
      pinEnabled: Boolean(pinHash),
    };
  }

  return {
    pinEnabled: Boolean(pinHash),
  };
}

export async function getEventByJoinToken(token: string) {
  const pool = getDatabasePool();

  if (!pool) {
    return getDemoEventByToken(token);
  }

  const { rows } = await pool.query<EventRow>(
    `select id, public_id, owner_user_id, join_token, name, template, status,
            plan, starts_at, ends_at, upload_closes_at, gallery_expires_at,
            language, welcome_message, pin_hash, collect_socials, storage_limit_bytes,
            storage_used_bytes
       from beenthere.events
      where join_token_hash = $1
      limit 1`,
    [sha256Hex(token)],
  );

  if (!rows[0]) {
    return getDemoEventByToken(token);
  }

  return mapEventRow(rows[0]);
}

export async function getEventGallery(publicId: string) {
  const pool = getDatabasePool();
  const t0 = Date.now();

  if (!pool) {
    const event = getDemoEventByPublicId(publicId);
    return event
      ? {
          event,
          photos: DEMO_PHOTOS,
          uploaderNames: DEMO_UPLOADER_NAMES,
        }
      : undefined;
  }

  const eventResult = await pool.query<EventRow>(
    `select id, public_id, owner_user_id, join_token, name, template, status,
            plan, starts_at, ends_at, upload_closes_at, gallery_expires_at,
            language, welcome_message, pin_hash, collect_socials, storage_limit_bytes,
            storage_used_bytes
       from beenthere.events
      where public_id = $1
      limit 1`,
    [publicId],
  );
  const eventRow = eventResult.rows[0];

  if (!eventRow) {
    return getDemoEventByPublicId(publicId)
      ? {
          event: DEMO_EVENT,
          photos: DEMO_PHOTOS,
          uploaderNames: DEMO_UPLOADER_NAMES,
        }
      : undefined;
  }

  const photoResult = await pool.query<
    PhotoRow & { participant_display_name: string | null }
  >(
    `select p.id, p.event_id, p.event_participant_id, p.status, p.visibility,
            p.in_gallery, p.original_key, p.thumbnail_key, p.preview_key, p.original_file_name,
            p.original_content_type, p.original_size_bytes, p.width, p.height,
            p.uploaded_at, p.taken_at, ep.display_name as participant_display_name
       from beenthere.photos p
       left join beenthere.event_participants ep
         on ep.id = p.event_participant_id
      where p.event_id = $1
        and p.visibility = 'visible'
        and p.in_gallery = true
      order by p.uploaded_at desc`,
    [eventRow.id],
  );

  const photoRows = photoResult.rows.map((row) => ({
    ...row,
    event_participants: { display_name: row.participant_display_name ?? "Guest" },
  }));
  const photos = await Promise.all(photoRows.map(mapPhotoRow));
  const uploaderNames = Object.fromEntries(
    photoRows.map((row) => [
      row.event_participant_id,
      row.event_participants?.display_name ?? "Guest",
    ]),
  );

  logger.info("gallery_loaded", {
    public_id: publicId,
    photo_count: photos.length,
    duration_ms: Date.now() - t0,
  });

  return {
    event: mapEventRow(eventRow),
    photos,
    uploaderNames,
  };
}

export async function getEventPhotos(eventId: string) {
  const pool = getDatabasePool();

  if (!pool) {
    return {
      photos: DEMO_PHOTOS.filter((photo) => photo.eventId === eventId),
      uploaderNames: DEMO_UPLOADER_NAMES,
    };
  }

  const photoResult = await pool.query<
    PhotoRow & { participant_display_name: string | null }
  >(
    `select p.id, p.event_id, p.event_participant_id, p.status, p.visibility,
            p.in_gallery, p.original_key, p.thumbnail_key, p.preview_key, p.original_file_name,
            p.original_content_type, p.original_size_bytes, p.width, p.height,
            p.uploaded_at, p.taken_at, ep.display_name as participant_display_name
       from beenthere.photos p
       left join beenthere.event_participants ep
         on ep.id = p.event_participant_id
      where p.event_id = $1
        and p.visibility <> 'deleted'
      order by p.uploaded_at desc`,
    [eventId],
  );

  const photoRows = photoResult.rows.map((row) => ({
    ...row,
    event_participants: { display_name: row.participant_display_name ?? "Guest" },
  }));
  const photos = await Promise.all(photoRows.map(mapPhotoRow));
  const uploaderNames = Object.fromEntries(
    photoRows.map((row) => [
      row.event_participant_id,
      row.event_participants?.display_name ?? "Guest",
    ]),
  );

  return { photos, uploaderNames };
}

export async function getDashboardEvent(publicId: string) {
  const gallery = await getEventGallery(publicId);
  const pool = getDatabasePool();

  if (!gallery) {
    return undefined;
  }

  if (!pool) {
    const [albums, customAlbums] = await Promise.all([
      getSmartAlbums(gallery.event.id),
      getCustomAlbums(gallery.event.id),
    ]);
    return {
      ...gallery,
      albums,
      customAlbums,
      reports: {},
      stats: {
        totalPhotos: gallery.photos.length,
        visiblePhotos: gallery.photos.filter(
          (photo) => photo.visibility === "visible",
        ).length,
        hiddenPhotos: gallery.photos.filter(
          (photo) => photo.visibility === "hidden",
        ).length,
        reportedPhotos: gallery.photos.filter(
          (photo) => photo.visibility === "reported",
        ).length,
        processingPhotos: gallery.photos.filter(
          (photo) => photo.status !== "ready",
        ).length,
        guestCount: new Set(gallery.photos.map((photo) => photo.participantId))
          .size,
      },
    };
  }

  const [{ rows }, reports, albums, customAlbums] = await Promise.all([
    pool.query<{
      total_photos: string | number;
      visible_photos: string | number;
      hidden_photos: string | number;
      reported_photos: string | number;
      processing_photos: string | number;
      guest_count: string | number;
    }>(
      `select
          count(*) as total_photos,
          count(*) filter (where visibility = 'visible') as visible_photos,
          count(*) filter (where visibility = 'hidden') as hidden_photos,
          count(*) filter (where visibility = 'reported') as reported_photos,
          count(*) filter (where status <> 'ready') as processing_photos,
          count(distinct event_participant_id) as guest_count
         from beenthere.photos
        where event_id = $1
          and visibility <> 'deleted'`,
      [gallery.event.id],
    ),
    getEventPhotoReports(gallery.event.id),
    getSmartAlbums(gallery.event.id),
    getCustomAlbums(gallery.event.id),
  ]);
  const stats = rows[0];

  return {
    ...gallery,
    albums,
    customAlbums,
    reports,
    stats: {
      totalPhotos: toNumber(stats.total_photos),
      visiblePhotos: toNumber(stats.visible_photos),
      hiddenPhotos: toNumber(stats.hidden_photos),
      reportedPhotos: toNumber(stats.reported_photos),
      processingPhotos: toNumber(stats.processing_photos),
      guestCount: toNumber(stats.guest_count),
    },
  };
}

export async function getSlideshowEvent(publicId: string) {
  const gallery = await getEventGallery(publicId);

  if (!gallery) {
    return undefined;
  }

  return {
    event: gallery.event,
    photos: gallery.photos.filter(
      (photo) => photo.status === "ready" && photo.visibility === "visible",
    ),
  };
}

export async function setPhotoVisibility(input: {
  photoId: string;
  visibility: Extract<PhotoVisibility, "visible" | "hidden" | "deleted">;
}) {
  const pool = getDatabasePool();

  if (!pool) {
    throw new Error("POSTGRES_URL is not configured.");
  }

  const { rows } = await pool.query<{ id: string; event_id: string; original_size_bytes: string }>(
    `update beenthere.photos
        set visibility = $2::beenthere.photo_visibility,
            deleted_at = case when $2::beenthere.photo_visibility = 'deleted' then now() else null end,
            in_gallery = case when $2::beenthere.photo_visibility in ('hidden', 'deleted') then false else in_gallery end
      where id = $1
        and visibility <> 'deleted'
      returning id, event_id, original_size_bytes`,
    [input.photoId, input.visibility],
  );

  if (!rows[0]) {
    throw new Error("Photo not found.");
  }

  if (input.visibility === "deleted") {
    await pool.query(
      `update beenthere.events
          set storage_used_bytes = greatest(0, storage_used_bytes - $1),
              updated_at = now()
        where id = $2`,
      [rows[0].original_size_bytes, rows[0].event_id],
    );
  }

  // A host visibility decision resolves any open reports on the photo.
  await pool.query(`delete from beenthere.photo_reports where photo_id = $1`, [
    input.photoId,
  ]);
}

const EVENT_SELECT_COLUMNS = `id, public_id, owner_user_id, join_token, name,
  template, status, plan, starts_at, ends_at, upload_closes_at,
  gallery_expires_at, language, welcome_message, pin_hash, collect_socials,
  storage_limit_bytes, storage_used_bytes`;

const DEFAULT_EVENT_STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024;

function createPublicId(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  const suffix = randomBytes(4).toString("hex");
  return slug ? `${slug}-${suffix}` : suffix;
}

export async function createEvent(input: {
  ownerUserId: string;
  name: string;
  template: EventTemplate;
  startsAt: Date;
}): Promise<EventRecord> {
  const pool = getDatabasePool();

  if (!pool) {
    throw new Error("POSTGRES_URL is not configured.");
  }

  const joinToken = randomBytes(18).toString("base64url");
  const startsAt = input.startsAt;
  const endsAt = new Date(startsAt.getTime() + 24 * 60 * 60 * 1000);
  const uploadClosesAt = new Date(startsAt.getTime() + 48 * 60 * 60 * 1000);
  const galleryExpiresAt = new Date(
    startsAt.getTime() + 30 * 24 * 60 * 60 * 1000,
  );

  const { rows } = await pool.query<EventRow>(
    `insert into beenthere.events (
        owner_user_id, public_id, join_token, join_token_hash, name, template,
        status, plan, starts_at, ends_at, upload_closes_at, gallery_expires_at,
        storage_limit_bytes
      )
      values ($1, $2, $3, $4, $5, $6, 'draft', 'draft', $7, $8, $9, $10, $11)
      returning ${EVENT_SELECT_COLUMNS}`,
    [
      input.ownerUserId,
      createPublicId(input.name),
      joinToken,
      sha256Hex(joinToken),
      input.name,
      input.template,
      startsAt.toISOString(),
      endsAt.toISOString(),
      uploadClosesAt.toISOString(),
      galleryExpiresAt.toISOString(),
      DEFAULT_EVENT_STORAGE_LIMIT_BYTES,
    ],
  );

  const event = mapEventRow(rows[0]);
  logger.info("event_created", { event_id: event.id, public_id: event.publicId, owner_user_id: input.ownerUserId });
  return event;
}

export async function getEventsByOwner(
  ownerUserId: string,
): Promise<EventRecord[]> {
  const pool = getDatabasePool();

  if (!pool) {
    return [];
  }

  const { rows } = await pool.query<EventRow>(
    `select ${EVENT_SELECT_COLUMNS}
       from beenthere.events
      where owner_user_id = $1
      order by created_at desc`,
    [ownerUserId],
  );

  return rows.map(mapEventRow);
}

export async function getEventByPublicId(
  publicId: string,
): Promise<EventRecord | undefined> {
  const pool = getDatabasePool();

  if (!pool) {
    const event = getDemoEventByPublicId(publicId);
    return event ?? undefined;
  }

  const { rows } = await pool.query<EventRow>(
    `select ${EVENT_SELECT_COLUMNS}
       from beenthere.events
      where public_id = $1
      limit 1`,
    [publicId],
  );

  return rows[0] ? mapEventRow(rows[0]) : undefined;
}

export async function getPhotoEventOwner(
  photoId: string,
): Promise<{ ownerUserId?: string } | undefined> {
  const pool = getDatabasePool();

  if (!pool) {
    return undefined;
  }

  const { rows } = await pool.query<{ owner_user_id: string | null }>(
    `select e.owner_user_id
       from beenthere.photos p
       join beenthere.events e on e.id = p.event_id
      where p.id = $1
      limit 1`,
    [photoId],
  );

  if (!rows[0]) {
    return undefined;
  }

  return { ownerUserId: rows[0].owner_user_id ?? undefined };
}

export async function activateEvent(publicId: string): Promise<EventRecord> {
  const pool = getDatabasePool();

  if (!pool) {
    throw new Error("POSTGRES_URL is not configured.");
  }

  const { rows } = await pool.query<EventRow>(
    `update beenthere.events
        set status = 'active',
            plan = 'event',
            updated_at = now()
      where public_id = $1
      returning ${EVENT_SELECT_COLUMNS}`,
    [publicId],
  );

  if (!rows[0]) {
    throw new Error("Event not found.");
  }

  const event = mapEventRow(rows[0]);
  logger.info("event_activated", { public_id: publicId, event_id: event.id });
  return event;
}

export async function createGuestParticipant(input: {
  eventId: string;
  displayName: string;
  consentVersion: string;
}): Promise<EventParticipant> {
  const pool = getDatabasePool();

  if (!pool) {
    throw new Error("POSTGRES_URL is not configured.");
  }

  const { rows } = await pool.query<{
    id: string;
    event_id: string;
    user_id: string | null;
    role: EventParticipant["role"];
    display_name: string;
    status: EventParticipant["status"];
    consent_uploaded_at: string | null;
    consent_version: string | null;
  }>(
    `insert into beenthere.event_participants (
        event_id, role, display_name, consent_uploaded_at, consent_version
      )
      values ($1, 'guest', $2, now(), $3)
      returning id, event_id, user_id, role, display_name, status,
                consent_uploaded_at, consent_version`,
    [input.eventId, input.displayName, input.consentVersion],
  );
  const data = rows[0];

  return {
    id: data.id,
    eventId: data.event_id,
    userId: data.user_id ?? undefined,
    role: data.role,
    displayName: data.display_name,
    status: data.status,
    consentUploadedAt: data.consent_uploaded_at ?? undefined,
    consentVersion: data.consent_version ?? undefined,
  };
}
