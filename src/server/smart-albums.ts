import { getDatabasePool } from "@/server/db";
import { createSignedPhotoReadUrl } from "@/server/r2";
import { logger } from "@/server/logger";
import type { SmartAlbum } from "@/types/domain";

type AlbumRow = {
  filter_value: string;
  label: string;
  photo_count: string | number;
  cover_thumbnail_key: string | null;
};

function toNumber(v: string | number) {
  return typeof v === "string" ? Number(v) : v;
}

export async function getSmartAlbums(eventId: string): Promise<SmartAlbum[]> {
  const pool = getDatabasePool();

  if (!pool) {
    return [
      {
        id: "demo-uploader-participant_demo_001",
        type: "by_uploader",
        label: "Mia",
        photoCount: 1,
        coverThumbnailUrl:
          "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=480&q=75",
        filterKey: "participantId",
        filterValue: "participant_demo_001",
      },
      {
        id: "demo-date-2026-06-06",
        type: "by_date",
        label: "Jun 6, 2026",
        photoCount: 3,
        coverThumbnailUrl:
          "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=480&q=75",
        filterKey: "date",
        filterValue: "2026-06-06",
      },
    ];
  }

  const [uploaderResult, dateResult, tagResult] = await Promise.all([
    // by uploader
    pool.query<AlbumRow & { participant_id: string }>(
      `select
          ep.id as filter_value,
          ep.display_name as label,
          count(p.id)::text as photo_count,
          (
            select p2.thumbnail_key
              from beenthere.photos p2
             where p2.event_participant_id = ep.id
               and p2.visibility = 'visible'
               and p2.status = 'ready'
               and p2.thumbnail_key is not null
             order by p2.uploaded_at asc
             limit 1
          ) as cover_thumbnail_key
        from beenthere.event_participants ep
        join beenthere.photos p
          on p.event_participant_id = ep.id
         and p.event_id = $1
         and p.visibility = 'visible'
         and p.status = 'ready'
       where ep.event_id = $1
         and ep.status = 'active'
         and ep.role = 'guest'
       group by ep.id, ep.display_name
      having count(p.id) > 0
       order by count(p.id) desc`,
      [eventId],
    ),

    // by date (taken_at or uploaded_at, whichever is available)
    // Use a CTE to avoid ungrouped column references in correlated subqueries.
    pool.query<AlbumRow>(
      `with dated as (
          select
            id,
            thumbnail_key,
            uploaded_at,
            to_char(coalesce(taken_at, uploaded_at)::date, 'YYYY-MM-DD') as day,
            to_char(coalesce(taken_at, uploaded_at)::date, 'Mon DD, YYYY')  as day_label
          from beenthere.photos
         where event_id = $1
           and visibility = 'visible'
           and status = 'ready'
       ),
       covers as (
          select distinct on (day)
            day,
            thumbnail_key as cover_thumbnail_key
          from dated
         where thumbnail_key is not null
         order by day, uploaded_at asc
       )
       select
         d.day          as filter_value,
         d.day_label    as label,
         count(d.id)::text as photo_count,
         c.cover_thumbnail_key
        from dated d
        left join covers c using (day)
       group by d.day, d.day_label, c.cover_thumbnail_key
       order by d.day asc`,
      [eventId],
    ),

    // by tag
    pool.query<AlbumRow>(
      `select
          ep.id as filter_value,
          ep.display_name as label,
          count(pt.photo_id)::text as photo_count,
          (
            select p2.thumbnail_key
              from beenthere.photo_tags pt2
              join beenthere.photos p2
                on p2.id = pt2.photo_id
             where pt2.tagged_participant_id = ep.id
               and p2.visibility = 'visible'
               and p2.status = 'ready'
               and p2.thumbnail_key is not null
             order by p2.uploaded_at asc
             limit 1
          ) as cover_thumbnail_key
        from beenthere.photo_tags pt
        join beenthere.event_participants ep
          on ep.id = pt.tagged_participant_id
        join beenthere.photos p
          on p.id = pt.photo_id
         and p.event_id = $1
         and p.visibility = 'visible'
         and p.status = 'ready'
       where ep.event_id = $1
         and ep.status = 'active'
       group by ep.id, ep.display_name
      having count(pt.photo_id) > 0
       order by count(pt.photo_id) desc`,
      [eventId],
    ),
  ]);

  const t0 = Date.now();

  // Resolve all cover URLs in parallel across all album types.
  const [uploaderAlbums, dateAlbums, tagAlbums] = await Promise.all([
    Promise.all(
      uploaderResult.rows.map(async (row) => ({
        id: `uploader-${row.filter_value}`,
        type: "by_uploader" as const,
        label: row.label,
        photoCount: toNumber(row.photo_count),
        coverThumbnailUrl: row.cover_thumbnail_key
          ? await createSignedPhotoReadUrl(row.cover_thumbnail_key)
          : "",
        filterKey: "participantId" as const,
        filterValue: row.filter_value,
      })),
    ),
    Promise.all(
      dateResult.rows.map(async (row) => ({
        id: `date-${row.filter_value}`,
        type: "by_date" as const,
        label: row.label,
        photoCount: toNumber(row.photo_count),
        coverThumbnailUrl: row.cover_thumbnail_key
          ? await createSignedPhotoReadUrl(row.cover_thumbnail_key)
          : "",
        filterKey: "date" as const,
        filterValue: row.filter_value,
      })),
    ),
    Promise.all(
      tagResult.rows.map(async (row) => ({
        id: `tag-${row.filter_value}`,
        type: "by_tag" as const,
        label: `Tagged: ${row.label}`,
        photoCount: toNumber(row.photo_count),
        coverThumbnailUrl: row.cover_thumbnail_key
          ? await createSignedPhotoReadUrl(row.cover_thumbnail_key)
          : "",
        filterKey: "taggedParticipantId" as const,
        filterValue: row.filter_value,
      })),
    ),
  ]);

  logger.debug("smart_albums_resolved", {
    event_id: eventId,
    uploader_count: uploaderAlbums.length,
    date_count: dateAlbums.length,
    tag_count: tagAlbums.length,
    duration_ms: Date.now() - t0,
  });

  return [...uploaderAlbums, ...dateAlbums, ...tagAlbums];
}
