import { NextResponse } from "next/server";
import { getEventManagerForApi } from "@/server/auth";
import { getEventByPublicId } from "@/server/data";
import { getDatabasePool } from "@/server/db";
import { logger } from "@/server/logger";

type RouteProps = { params: Promise<{ eventId: string }> };

export async function POST(_request: Request, { params }: RouteProps) {
  const { eventId: publicId } = await params;
  const event = await getEventByPublicId(publicId);

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const auth = await getEventManagerForApi(event.ownerUserId);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (event.status !== "ended") {
    return NextResponse.json({ error: "Event is not closed." }, { status: 400 });
  }

  const pool = getDatabasePool();
  if (!pool) {
    return NextResponse.json({ error: "POSTGRES_URL is not configured." }, { status: 501 });
  }

  // Push ends_at 1 year out so the auto-close task never picks it up.
  const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  await pool.query(
    `update beenthere.events set status = 'active', ends_at = $2 where public_id = $1`,
    [publicId, farFuture],
  );

  logger.info("event_extended", { event_id: event.id, public_id: publicId });

  return NextResponse.json({ ok: true });
}
