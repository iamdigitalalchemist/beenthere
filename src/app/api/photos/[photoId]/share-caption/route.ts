import { NextResponse } from "next/server";
import { getEventManagerForApi } from "@/server/auth";
import { getDatabasePool } from "@/server/db";
import { getPhotoEventId, getPhotoTags } from "@/server/photo-tags";
import type { GuestSocialHandles } from "@/types/domain";

type RouteProps = { params: Promise<{ photoId: string }> };

type TaggedGuest = {
  displayName: string;
  handles: GuestSocialHandles;
};

function buildCaption(guests: TaggedGuest[], platform: string): string {
  if (guests.length === 0) return "";

  const handleKey = platform as keyof GuestSocialHandles;
  const mentions = guests
    .map((g) => {
      const handle = g.handles[handleKey];
      return handle ? `@${handle}` : g.displayName;
    })
    .join(" ");

  return mentions;
}

export async function GET(request: Request, { params }: RouteProps) {
  const { photoId } = await params;

  const eventId = await getPhotoEventId(photoId);

  if (!eventId) {
    return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  }

  const pool = getDatabasePool();

  // Resolve event owner for auth
  let ownerUserId: string | null = null;

  if (pool) {
    const { rows } = await pool.query<{ owner_user_id: string | null }>(
      `select e.owner_user_id
         from beenthere.events e
         join beenthere.photos p on p.event_id = e.id
        where p.id = $1
        limit 1`,
      [photoId],
    );
    ownerUserId = rows[0]?.owner_user_id ?? null;
  }

  const host = await getEventManagerForApi(ownerUserId ?? undefined);

  if (!host.ok) {
    return NextResponse.json({ error: host.error }, { status: host.status });
  }

  const tags = await getPhotoTags(photoId);

  if (tags.length === 0) {
    return NextResponse.json({
      tagged: [],
      captions: { instagram: "", facebook: "", x: "", tiktok: "" },
    });
  }

  // Fetch social handles for all tagged participants
  let guests: TaggedGuest[] = tags.map((t) => ({
    displayName: t.displayName,
    handles: {},
  }));

  if (pool) {
    const ids = tags.map((t) => t.participantId);
    const { rows } = await pool.query<{
      id: string;
      display_name: string;
      instagram_handle: string | null;
      facebook_handle: string | null;
      x_handle: string | null;
      tiktok_handle: string | null;
    }>(
      `select id, display_name, instagram_handle, facebook_handle, x_handle, tiktok_handle
         from beenthere.event_participants
        where id = any($1::uuid[])`,
      [ids],
    );

    const byId = Object.fromEntries(rows.map((r) => [r.id, r]));

    guests = tags.map((t) => {
      const row = byId[t.participantId];
      return {
        displayName: t.displayName,
        handles: {
          instagram: row?.instagram_handle ?? undefined,
          facebook: row?.facebook_handle ?? undefined,
          x: row?.x_handle ?? undefined,
          tiktok: row?.tiktok_handle ?? undefined,
        },
      };
    });
  }

  return NextResponse.json({
    tagged: guests.map((g) => ({ displayName: g.displayName, handles: g.handles })),
    captions: {
      instagram: buildCaption(guests, "instagram"),
      facebook: buildCaption(guests, "facebook"),
      x: buildCaption(guests, "x"),
      tiktok: buildCaption(guests, "tiktok"),
    },
  });
}
