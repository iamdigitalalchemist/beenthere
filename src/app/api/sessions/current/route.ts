import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getActiveParticipantForSession } from "@/server/sessions";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const eventId = url.searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json(
      { error: "eventId is required." },
      { status: 400 },
    );
  }

  const participant = await getActiveParticipantForSession({
    eventId,
    cookies: await cookies(),
  });

  return NextResponse.json({ participant: participant ?? null });
}
