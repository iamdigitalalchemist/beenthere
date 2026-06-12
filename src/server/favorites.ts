import { getDatabasePool } from "@/server/db";

export async function getParticipantFavoritePhotoIds(participantId: string) {
  const pool = getDatabasePool();

  if (!pool) {
    return [];
  }

  try {
    const { rows } = await pool.query<{ photo_id: string }>(
      `select photo_id
         from beenthere.photo_favorites
        where event_participant_id = $1`,
      [participantId],
    );

    return rows.map((row) => row.photo_id);
  } catch {
    return [];
  }
}

export async function setParticipantPhotoFavorite(input: {
  participantId: string;
  photoId: string;
  saved: boolean;
}) {
  const pool = getDatabasePool();

  if (!pool) {
    throw new Error("POSTGRES_URL is not configured.");
  }

  if (input.saved) {
    await pool.query(
      `insert into beenthere.photo_favorites (photo_id, event_participant_id)
       values ($1, $2)
       on conflict (photo_id, event_participant_id) do nothing`,
      [input.photoId, input.participantId],
    );
    return;
  }

  await pool.query(
    `delete from beenthere.photo_favorites
      where photo_id = $1
        and event_participant_id = $2`,
    [input.photoId, input.participantId],
  );
}
