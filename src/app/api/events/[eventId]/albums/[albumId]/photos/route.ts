import { NextResponse } from "next/server";
import { getEventManagerForApi } from "@/server/auth";
import { getEventByPublicId } from "@/server/data";
import {
  getAlbumEventId,
  getAlbumPhotoIds,
  setAlbumPhoto,
} from "@/server/custom-albums";

type RouteProps = { params: Promise<{ eventId: string; albumId: string }> };

async function resolveAndAuth(eventId: string, albumId: string) {
  const [event, albumEventPublicId] = await Promise.all([
    getEventByPublicId(eventId),
    getAlbumEventId(albumId),
  ]);

  if (!event) return { error: "Event not found.", status: 404 } as const;
  if (albumEventPublicId !== eventId) return { error: "Album not found.", status: 404 } as const;

  const host = await getEventManagerForApi(event.ownerUserId);
  if (!host.ok) return { error: host.error, status: host.status } as const;

  return { ok: true } as const;
}

export async function GET(_request: Request, { params }: RouteProps) {
  const { eventId, albumId } = await params;
  const auth = await resolveAndAuth(eventId, albumId);
  if (!("ok" in auth)) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const photoIds = await getAlbumPhotoIds(albumId);
  return NextResponse.json({ photoIds });
}

export async function POST(request: Request, { params }: RouteProps) {
  const { eventId, albumId } = await params;
  const auth = await resolveAndAuth(eventId, albumId);
  if (!("ok" in auth)) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json()) as Partial<{ photoId: string; add: boolean }>;
  if (!body.photoId) return NextResponse.json({ error: "photoId is required." }, { status: 400 });

  await setAlbumPhoto(albumId, body.photoId, body.add !== false);
  return NextResponse.json({ ok: true });
}
