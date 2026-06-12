import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isSecureCookieContext } from "@/server/cookie-policy";
import { hasDatabaseConnection } from "@/server/db";
import { assertPinAccessForEventId } from "@/server/pin-guard";
import { isValidGuestRecoveryCode } from "@/lib/guest-recovery";
import { resumeParticipantForSession } from "@/server/sessions";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<{
    eventId: string;
    participantId: string;
    recoveryCode: string;
  }>;

  if (!body.eventId || (!body.participantId && !body.recoveryCode)) {
    return NextResponse.json(
      { error: "eventId and either participantId or recoveryCode are required." },
      { status: 400 },
    );
  }

  if (body.recoveryCode && !isValidGuestRecoveryCode(body.recoveryCode)) {
    return NextResponse.json(
      { error: "Enter a valid 6-character guest code." },
      { status: 400 },
    );
  }

  if (!hasDatabaseConnection()) {
    return NextResponse.json(
      {
        error:
          "POSTGRES_URL is not configured. Resume is unavailable in demo mode.",
      },
      { status: 501 },
    );
  }

  const pinDenied = await assertPinAccessForEventId(body.eventId);

  if (pinDenied) {
    return pinDenied;
  }

  try {
    const participant = await resumeParticipantForSession({
      eventId: body.eventId,
      participantId: body.participantId,
      recoveryCode: body.recoveryCode,
      cookies: await cookies(),
      secureCookies: isSecureCookieContext(request),
    });

    return NextResponse.json({ participant });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not resume this guest profile.",
      },
      { status: 404 },
    );
  }
}
