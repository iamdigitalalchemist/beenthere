import { NextResponse } from "next/server";
import { getEventManagerForApi } from "@/server/auth";
import { getDatabasePool } from "@/server/db";
import { getEventByPublicId } from "@/server/data";

type RouteProps = { params: Promise<{ eventId: string }> };

export async function PATCH(request: Request, { params }: RouteProps) {
  const { eventId } = await params;
  const event = await getEventByPublicId(eventId);

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const host = await getEventManagerForApi(event.ownerUserId);

  if (!host.ok) {
    return NextResponse.json({ error: host.error }, { status: host.status });
  }

  const body = (await request.json()) as Partial<{ collectSocials: boolean }>;

  if (typeof body.collectSocials !== "boolean") {
    return NextResponse.json({ error: "collectSocials must be a boolean." }, { status: 400 });
  }

  const pool = getDatabasePool();

  if (!pool) {
    return NextResponse.json({ collectSocials: body.collectSocials });
  }

  await pool.query(
    `update beenthere.events set collect_socials = $1 where public_id = $2`,
    [body.collectSocials, eventId],
  );

  return NextResponse.json({ collectSocials: body.collectSocials });
}
