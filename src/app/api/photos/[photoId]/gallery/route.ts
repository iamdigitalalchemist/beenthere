import { NextResponse } from "next/server";
import { getEventManagerForApi } from "@/server/auth";
import { getPhotoEventOwner } from "@/server/data";
import { getDatabasePool } from "@/server/db";
import * as Sentry from "@sentry/nextjs";

type RouteProps = { params: Promise<{ photoId: string }> };

export async function PATCH(request: Request, { params }: RouteProps) {
  const { photoId } = await params;
  const photoEvent = await getPhotoEventOwner(photoId);

  if (!photoEvent) {
    return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  }

  const host = await getEventManagerForApi(photoEvent.ownerUserId);
  if (!host.ok) {
    return NextResponse.json({ error: host.error }, { status: host.status });
  }

  const body = (await request.json()) as Partial<{ inGallery: boolean }>;
  if (typeof body.inGallery !== "boolean") {
    return NextResponse.json({ error: "inGallery (boolean) is required." }, { status: 400 });
  }

  const pool = getDatabasePool();
  if (!pool) {
    return NextResponse.json({ error: "Database not available." }, { status: 501 });
  }

  try {
    // Can only add to gallery if photo is visible; removing is always allowed.
    await pool.query(
      `update beenthere.photos
          set in_gallery = $2
        where id = $1
          and visibility <> 'deleted'
          and ($2 = false or visibility = 'visible')`,
      [photoId, body.inGallery],
    );
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }

  return NextResponse.json({ ok: true });
}
