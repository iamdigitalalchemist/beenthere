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

  if (event.status === "ended" || event.status === "expired") {
    return NextResponse.json({ event });
  }

  const pool = getDatabasePool();
  if (!pool) {
    return NextResponse.json({ error: "POSTGRES_URL is not configured." }, { status: 501 });
  }

  await pool.query(
    `update beenthere.events set status = 'ended' where public_id = $1`,
    [publicId],
  );

  logger.info("event_closed", { event_id: event.id, public_id: publicId });

  return NextResponse.json({ ok: true });
}
