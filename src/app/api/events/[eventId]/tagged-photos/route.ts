import { NextResponse } from "next/server";
import { getEventManagerForApi } from "@/server/auth";
import { getDatabasePool } from "@/server/db";
import { getEventByPublicId } from "@/server/data";

type RouteProps = { params: Promise<{ eventId: string }> };

export async function GET(request: Request, { params }: RouteProps) {
  const { eventId } = await params;
  const event = await getEventByPublicId(eventId);

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const host = await getEventManagerForApi(event.ownerUserId);

  if (!host.ok) {
    return NextResponse.json({ error: host.error }, { status: host.status });
  }

  const url = new URL(request.url);
  const taggedParticipantId = url.searchParams.get("taggedParticipantId");

  if (!taggedParticipantId) {
    return NextResponse.json(
      { error: "taggedParticipantId is required." },
      { status: 400 },
    );
  }

  const pool = getDatabasePool();

  if (!pool) {
    return NextResponse.json({ photoIds: [] });
  }

  const { rows } = await pool.query<{ photo_id: string }>(
    `select pt.photo_id
       from beenthere.photo_tags pt
       join beenthere.photos p on p.id = pt.photo_id
      where pt.tagged_participant_id = $1
        and p.event_id = $2
        and p.visibility <> 'deleted'
        and p.status = 'ready'`,
    [taggedParticipantId, event.id],
  );

  return NextResponse.json({ photoIds: rows.map((r) => r.photo_id) });
}
