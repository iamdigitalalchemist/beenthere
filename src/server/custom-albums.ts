import { getDatabasePool } from "@/server/db";
import { createSignedPhotoReadUrl } from "@/server/r2";
import type { CustomAlbum } from "@/types/domain";

type AlbumRow = {
  id: string;
  name: string;
  created_at: string;
  photo_count: string | number;
  cover_thumbnail_key: string | null;
};

function toNumber(v: string | number) {
  return typeof v === "string" ? Number(v) : v;
}

export async function getCustomAlbums(eventId: string): Promise<CustomAlbum[]> {
  const pool = getDatabasePool();
  if (!pool) return [];

  const { rows } = await pool.query<AlbumRow>(
    `select
        a.id,
        a.name,
        a.created_at,
        count(ap.photo_id)::text as photo_count,
        (
          select p.thumbnail_key
            from beenthere.album_photos ap2
            join beenthere.photos p on p.id = ap2.photo_id
           where ap2.album_id = a.id
             and p.visibility = 'visible'
             and p.status = 'ready'
             and p.thumbnail_key is not null
           order by ap2.added_at asc
           limit 1
        ) as cover_thumbnail_key
       from beenthere.photo_albums a
       left join beenthere.album_photos ap on ap.album_id = a.id
      where a.event_id = $1
      group by a.id, a.name, a.created_at
      order by a.created_at desc`,
    [eventId],
  );

  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      name: row.name,
      photoCount: toNumber(row.photo_count),
      coverThumbnailUrl: row.cover_thumbnail_key
        ? await createSignedPhotoReadUrl(row.cover_thumbnail_key)
        : "",
      createdAt: typeof row.created_at === "string"
        ? row.created_at
        : (row.created_at as Date).toISOString(),
    })),
  );
}

export async function getAlbumPhotoIds(albumId: string): Promise<string[]> {
  const pool = getDatabasePool();
  if (!pool) return [];

  const { rows } = await pool.query<{ photo_id: string }>(
    `select photo_id from beenthere.album_photos where album_id = $1 order by added_at asc`,
    [albumId],
  );
  return rows.map((r) => r.photo_id);
}

export async function createCustomAlbum(eventId: string, name: string): Promise<string> {
  const pool = getDatabasePool();
  if (!pool) throw new Error("Database not available.");

  const { rows } = await pool.query<{ id: string }>(
    `insert into beenthere.photo_albums (event_id, name) values ($1, $2) returning id`,
    [eventId, name.trim()],
  );
  return rows[0]!.id;
}

export async function renameCustomAlbum(albumId: string, name: string): Promise<void> {
  const pool = getDatabasePool();
  if (!pool) throw new Error("Database not available.");

  await pool.query(
    `update beenthere.photo_albums set name = $2, updated_at = now() where id = $1`,
    [albumId, name.trim()],
  );
}

export async function deleteCustomAlbum(albumId: string): Promise<void> {
  const pool = getDatabasePool();
  if (!pool) throw new Error("Database not available.");

  await pool.query(`delete from beenthere.photo_albums where id = $1`, [albumId]);
}

export async function setAlbumPhoto(
  albumId: string,
  photoId: string,
  add: boolean,
): Promise<void> {
  const pool = getDatabasePool();
  if (!pool) throw new Error("Database not available.");

  if (add) {
    await pool.query(
      `insert into beenthere.album_photos (album_id, photo_id) values ($1, $2) on conflict do nothing`,
      [albumId, photoId],
    );
  } else {
    await pool.query(
      `delete from beenthere.album_photos where album_id = $1 and photo_id = $2`,
      [albumId, photoId],
    );
  }
}

export async function addAlbumPhotos(albumId: string, photoIds: string[]): Promise<void> {
  const pool = getDatabasePool();
  if (!pool || photoIds.length === 0) return;

  const values = photoIds.map((_, i) => `($1, $${i + 2})`).join(", ");
  await pool.query(
    `insert into beenthere.album_photos (album_id, photo_id) values ${values} on conflict do nothing`,
    [albumId, ...photoIds],
  );
}

export async function getAlbumEventId(albumId: string): Promise<string | null> {
  const pool = getDatabasePool();
  if (!pool) return null;

  const { rows } = await pool.query<{ event_id: string }>(
    `select e.public_id as event_id
       from beenthere.photo_albums a
       join beenthere.events e on e.id = a.event_id
      where a.id = $1 limit 1`,
    [albumId],
  );
  return rows[0]?.event_id ?? null;
}
