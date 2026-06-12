import { getDatabasePool } from "@/server/db";
import { resolveProfilePhotoUrl } from "@/server/participant-profile";
import type { PhotoTag } from "@/types/domain";

const demoPhotoTags = new Map<string, PhotoTag[]>();

export async function getPhotoEventId(photoId: string) {
  const pool = getDatabasePool();

  if (!pool) {
    return photoId.startsWith("photo_demo_") ? "evt_demo_001" : undefined;
  }

  const { rows } = await pool.query<{ event_id: string }>(
    `select event_id
       from beenthere.photos
      where id = $1
      limit 1`,
    [photoId],
  );

  return rows[0]?.event_id;
}

export async function getPhotoLikeCount(photoId: string) {
  const pool = getDatabasePool();

  if (!pool) {
    return 0;
  }

  const { rows } = await pool.query<{ like_count: string | number }>(
    `select count(*) as like_count
       from beenthere.photo_favorites
      where photo_id = $1`,
    [photoId],
  );

  const value = rows[0]?.like_count ?? 0;
  return typeof value === "string" ? Number(value) : value;
}

function updateDemoPhotoTags(input: {
  photoId: string;
  taggedParticipantId: string;
  taggedByParticipantId: string;
  tagged: boolean;
  displayName?: string;
}) {
  const currentTags = demoPhotoTags.get(input.photoId) ?? [];
  const nextTags = input.tagged
    ? currentTags.some((tag) => tag.participantId === input.taggedParticipantId)
      ? currentTags
      : [
          ...currentTags,
          {
            participantId: input.taggedParticipantId,
            displayName: input.displayName ?? "Guest",
            taggedByParticipantId: input.taggedByParticipantId,
          },
        ]
    : currentTags.filter(
        (tag) => tag.participantId !== input.taggedParticipantId,
      );

  demoPhotoTags.set(input.photoId, nextTags);
  return nextTags;
}

export async function getPhotoTags(photoId: string) {
  const pool = getDatabasePool();

  if (!pool) {
    return demoPhotoTags.get(photoId) ?? [];
  }

  const { rows } = await pool.query<{
    tagged_participant_id: string;
    display_name: string;
    tagged_by_participant_id: string;
  }>(
    `select pt.tagged_participant_id, ep.display_name, pt.tagged_by_participant_id
       from beenthere.photo_tags pt
       join beenthere.event_participants ep
         on ep.id = pt.tagged_participant_id
      where pt.photo_id = $1
      order by pt.created_at asc`,
    [photoId],
  );

  return rows.map((row) => ({
    participantId: row.tagged_participant_id,
    displayName: row.display_name,
    taggedByParticipantId: row.tagged_by_participant_id,
  }));
}

export async function setPhotoTag(input: {
  photoId: string;
  taggedParticipantId: string;
  taggedByParticipantId: string;
  tagged: boolean;
  displayName?: string;
}) {
  const pool = getDatabasePool();

  if (!pool) {
    return updateDemoPhotoTags(input);
  }

  if (input.tagged) {
    const { rows: participantRows } = await pool.query<{ id: string }>(
      `select ep.id
         from beenthere.event_participants ep
         join beenthere.photos p
           on p.event_id = ep.event_id
        where ep.id = $1
          and p.id = $2
          and ep.status = 'active'
        limit 1`,
      [input.taggedParticipantId, input.photoId],
    );

    if (!participantRows[0]) {
      throw new Error("That guest is not part of this event.");
    }

    await pool.query(
      `insert into beenthere.photo_tags (
          photo_id, tagged_participant_id, tagged_by_participant_id
        )
        values ($1, $2, $3)
        on conflict (photo_id, tagged_participant_id) do nothing`,
      [input.photoId, input.taggedParticipantId, input.taggedByParticipantId],
    );
  } else {
    await pool.query(
      `delete from beenthere.photo_tags
        where photo_id = $1
          and tagged_participant_id = $2`,
      [input.photoId, input.taggedParticipantId],
    );
  }

  return getPhotoTags(input.photoId);
}

export async function getEventParticipants(eventId: string) {
  const pool = getDatabasePool();

  if (!pool) {
    return Object.entries({
      participant_demo_001: "Mia",
      participant_demo_002: "Jonas",
      participant_demo_003: "Amira",
    }).map(([id, displayName]) => ({
      id,
      displayName,
    }));
  }

  try {
    const { rows } = await pool.query<{
      id: string;
      display_name: string;
      profile_photo_key: string | null;
      instagram_handle: string | null;
      facebook_handle: string | null;
      x_handle: string | null;
      tiktok_handle: string | null;
    }>(
      `select id, display_name, profile_photo_key,
              instagram_handle, facebook_handle, x_handle, tiktok_handle
         from beenthere.event_participants
        where event_id = $1
          and status = 'active'
        order by display_name asc`,
      [eventId],
    );

    return Promise.all(
      rows.map(async (row) => ({
        id: row.id,
        displayName: row.display_name,
        profilePhotoUrl: await resolveProfilePhotoUrl(row.profile_photo_key),
        socialHandles: {
          instagram: row.instagram_handle ?? undefined,
          facebook: row.facebook_handle ?? undefined,
          x: row.x_handle ?? undefined,
          tiktok: row.tiktok_handle ?? undefined,
        },
      })),
    );
  } catch {
    const { rows } = await pool.query<{
      id: string;
      display_name: string;
    }>(
      `select id, display_name
         from beenthere.event_participants
        where event_id = $1
          and status = 'active'
        order by display_name asc`,
      [eventId],
    );

    return rows.map((row) => ({
      id: row.id,
      displayName: row.display_name,
    }));
  }
}
