import { NextResponse } from "next/server";
import { getEventManagerForApi } from "@/server/auth";
import { getEventByPublicId } from "@/server/data";
import { createCustomAlbum, getCustomAlbums } from "@/server/custom-albums";

type RouteProps = { params: Promise<{ eventId: string }> };

export async function GET(_request: Request, { params }: RouteProps) {
  const { eventId } = await params;
  const event = await getEventByPublicId(eventId);
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  const host = await getEventManagerForApi(event.ownerUserId);
  if (!host.ok) return NextResponse.json({ error: host.error }, { status: host.status });

  const albums = await getCustomAlbums(event.id);
  return NextResponse.json({ albums });
}

export async function POST(request: Request, { params }: RouteProps) {
  const { eventId } = await params;
  const event = await getEventByPublicId(eventId);
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  const host = await getEventManagerForApi(event.ownerUserId);
  if (!host.ok) return NextResponse.json({ error: host.error }, { status: host.status });

  const body = (await request.json()) as Partial<{ name: string }>;
  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: "Album name is required." }, { status: 400 });

  const id = await createCustomAlbum(event.id, name);
  return NextResponse.json({ id, name }, { status: 201 });
}
