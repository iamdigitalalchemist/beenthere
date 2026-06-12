import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasDatabaseConnection } from "@/server/db";
import { assertPinAccessForEventId } from "@/server/pin-guard";
import { regenerateRecoveryCodeForSession } from "@/server/sessions";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<{
    eventId: string;
    participantId: string;
  }>;

  if (!body.eventId || !body.participantId) {
    return NextResponse.json(
      { error: "eventId and participantId are required." },
      { status: 400 },
    );
  }

  if (!hasDatabaseConnection()) {
    return NextResponse.json(
      { error: "Guest codes require POSTGRES_URL to be configured." },
      { status: 501 },
    );
  }

  const pinDenied = await assertPinAccessForEventId(body.eventId);

  if (pinDenied) {
    return pinDenied;
  }

  try {
    const result = await regenerateRecoveryCodeForSession({
      eventId: body.eventId,
      participantId: body.participantId,
      cookies: await cookies(),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not create a new guest code.",
      },
      { status: 400 },
    );
  }
}
