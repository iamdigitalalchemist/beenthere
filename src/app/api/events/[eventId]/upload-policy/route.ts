import { NextResponse } from "next/server";
import { getEventManagerForApi } from "@/server/auth";
import { getDatabasePool } from "@/server/db";
import { getEventByPublicId } from "@/server/data";
import type { UploadPolicy } from "@/types/domain";

type RouteProps = { params: Promise<{ eventId: string }> };

const VALID_POLICIES: UploadPolicy[] = ["open", "curated", "strict"];

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

  const body = (await request.json()) as Partial<{ uploadPolicy: UploadPolicy }>;

  if (!body.uploadPolicy || !VALID_POLICIES.includes(body.uploadPolicy)) {
    return NextResponse.json({ error: "uploadPolicy must be open, curated, or strict." }, { status: 400 });
  }

  const pool = getDatabasePool();
  if (!pool) {
    return NextResponse.json({ uploadPolicy: body.uploadPolicy });
  }

  await pool.query(
    `update beenthere.events set upload_policy = $1 where public_id = $2`,
    [body.uploadPolicy, eventId],
  );

  return NextResponse.json({ uploadPolicy: body.uploadPolicy });
}
