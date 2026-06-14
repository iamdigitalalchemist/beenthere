import { NextResponse } from "next/server";
import { getUserForApi } from "@/server/auth";
import { createEvent } from "@/server/data";
import { getDatabasePool } from "@/server/db";
import type { EventTemplate } from "@/types/domain";

const TEMPLATES: EventTemplate[] = [
  "wedding",
  "birthday",
  "corporate",
  "party",
  "graduation",
  "reunion",
  "conference",
  "other",
];

export async function POST(request: Request) {
  const auth = await getUserForApi();

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!getDatabasePool()) {
    return NextResponse.json(
      { error: "Event creation requires a configured database." },
      { status: 501 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as Partial<{
    name: string;
    template: string;
    startsAt: string;
  }>;

  const name = body.name?.trim();

  if (!name || name.length < 3 || name.length > 80) {
    return NextResponse.json(
      { error: "Event name must be between 3 and 80 characters." },
      { status: 400 },
    );
  }

  const template = TEMPLATES.includes(body.template as EventTemplate)
    ? (body.template as EventTemplate)
    : "other";

  const startsAt = body.startsAt ? new Date(body.startsAt) : new Date();

  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json(
      { error: "startsAt must be a valid date." },
      { status: 400 },
    );
  }

  const event = await createEvent({
    ownerUserId: auth.user.id,
    name,
    template,
    startsAt,
  });

  return NextResponse.json({ event });
}
