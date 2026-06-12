import { getDatabasePool } from "@/server/db";
import type { PhotoReportSummary } from "@/types/domain";

export async function getPhotoEventId(photoId: string) {
  const pool = getDatabasePool();

  if (!pool) {
    return undefined;
  }

  const { rows } = await pool.query<{ event_id: string }>(
    `select event_id from beenthere.photos where id = $1 limit 1`,
    [photoId],
  );

  return rows[0]?.event_id;
}

export async function reportPhoto(input: {
  photoId: string;
  participantId?: string;
  reason?: string;
}) {
  const pool = getDatabasePool();

  if (!pool) {
    throw new Error("POSTGRES_URL is not configured.");
  }

  const client = await pool.connect();

  try {
    await client.query("begin");

    await client.query(
      `insert into beenthere.photo_reports (photo_id, event_participant_id, reason)
       values ($1, $2, $3)`,
      [input.photoId, input.participantId ?? null, input.reason ?? null],
    );

    await client.query(
      `update beenthere.photos
          set visibility = 'reported'
        where id = $1
          and visibility in ('visible', 'pending_review')`,
      [input.photoId],
    );

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function getEventPhotoReports(
  eventId: string,
): Promise<Record<string, PhotoReportSummary>> {
  const pool = getDatabasePool();

  if (!pool) {
    return {};
  }

  const { rows } = await pool.query<{
    photo_id: string;
    report_count: string | number;
    reasons: (string | null)[];
  }>(
    `select r.photo_id,
            count(*) as report_count,
            array_agg(r.reason order by r.created_at desc) as reasons
       from beenthere.photo_reports r
       join beenthere.photos p on p.id = r.photo_id
      where p.event_id = $1
      group by r.photo_id`,
    [eventId],
  );

  return Object.fromEntries(
    rows.map((row) => [
      row.photo_id,
      {
        count: Number(row.report_count),
        reasons: row.reasons.filter((reason): reason is string =>
          Boolean(reason?.trim()),
        ),
      },
    ]),
  );
}
