import { NextResponse } from "next/server";
import { getEventManagerForApi } from "@/server/auth";
import { getEventByPublicId } from "@/server/data";
import {
  deleteCustomAlbum,
  getAlbumEventId,
  renameCustomAlbum,
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

export async function PATCH(request: Request, { params }: RouteProps) {
  const { eventId, albumId } = await params;
  const auth = await resolveAndAuth(eventId, albumId);
  if (!("ok" in auth)) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json()) as Partial<{ name: string }>;
  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "Album name is required." }, { status: 400 });

  await renameCustomAlbum(albumId, name);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: RouteProps) {
  const { eventId, albumId } = await params;
  const auth = await resolveAndAuth(eventId, albumId);
  if (!("ok" in auth)) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await deleteCustomAlbum(albumId);
  return NextResponse.json({ ok: true });
}
