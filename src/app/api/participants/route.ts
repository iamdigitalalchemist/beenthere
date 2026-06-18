import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isSecureCookieContext } from "@/server/cookie-policy";
import { hasDatabaseConnection } from "@/server/db";
import { assertPinAccessForEventId } from "@/server/pin-guard";
import {
  createParticipantForSession,
  updateParticipantProfile,
} from "@/server/sessions";
import { logger } from "@/server/logger";
import * as Sentry from "@sentry/nextjs";
import type { GuestSocialHandles } from "@/types/domain";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<{
    eventId: string;
    displayName: string;
    consentVersion: string;
    socialHandles: Partial<GuestSocialHandles>;
  }>;

  if (!body.eventId || !body.displayName?.trim() || !body.consentVersion) {
    return NextResponse.json(
      { error: "eventId, displayName, and consentVersion are required." },
      { status: 400 },
    );
  }

  if (!hasDatabaseConnection()) {
    return NextResponse.json(
      {
        error:
          "POSTGRES_URL is not configured. Local participant fallback is available.",
      },
      { status: 501 },
    );
  }

  const pinDenied = await assertPinAccessForEventId(body.eventId);

  if (pinDenied) {
    return pinDenied;
  }

  try {
    const cookieStore = await cookies();
    const result = await createParticipantForSession({
      eventId: body.eventId,
      displayName: body.displayName.trim(),
      consentVersion: body.consentVersion,
      socialHandles: body.socialHandles,
      cookies: cookieStore,
      secureCookies: isSecureCookieContext(request),
    });

    logger.info("participant_joined", {
      event_id: body.eventId,
      participant_id: result.participant.id,
    });

    return NextResponse.json({
      participant: result.participant,
      recoveryCode: result.recoveryCode,
    });
  } catch (error) {
    Sentry.captureException(error);
    logger.error("participant_join_failed", {
      event_id: body.eventId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not create guest profile.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as Partial<{
    participantId: string;
    displayName: string;
    socialHandles: Partial<GuestSocialHandles>;
  }>;

  if (!body.participantId || !body.displayName?.trim()) {
    return NextResponse.json(
      { error: "participantId and displayName are required." },
      { status: 400 },
    );
  }

  try {
    const participant = await updateParticipantProfile({
      participantId: body.participantId,
      displayName: body.displayName.trim(),
      socialHandles: body.socialHandles,
      cookies: await cookies(),
    });

    return NextResponse.json({ participant });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not update guest profile.",
      },
      { status: 500 },
    );
  }
}
