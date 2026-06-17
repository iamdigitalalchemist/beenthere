import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDatabasePool } from "@/server/db";
import { getPhotoEventId, reportPhoto } from "@/server/photo-reports";
import { assertPinAccessForEventId } from "@/server/pin-guard";
import { getActiveParticipantForSession } from "@/server/sessions";
import { logger } from "@/server/logger";
import * as Sentry from "@sentry/nextjs";

type PhotoReportsRouteProps = {
  params: Promise<{
    photoId: string;
  }>;
};

const MAX_REASON_LENGTH = 500;

export async function POST(
  request: Request,
  { params }: PhotoReportsRouteProps,
) {
  if (!getDatabasePool()) {
    return NextResponse.json(
      { error: "Reporting requires a configured database." },
      { status: 501 },
    );
  }

  const { photoId } = await params;
  const body = (await request.json().catch(() => ({}))) as Partial<{
    reason: string;
  }>;

  const reason =
    typeof body.reason === "string"
      ? body.reason.trim().slice(0, MAX_REASON_LENGTH)
      : undefined;

  const eventId = await getPhotoEventId(photoId);

  if (!eventId) {
    return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  }

  const pinDenied = await assertPinAccessForEventId(eventId);

  if (pinDenied) {
    return pinDenied;
  }

  const participant = await getActiveParticipantForSession({
    eventId,
    cookies: await cookies(),
  });

  try {
    await reportPhoto({
      photoId,
      participantId: participant?.id,
      reason: reason || undefined,
    });

    logger.info("photo_reported", {
      photo_id: photoId,
      event_id: eventId,
      participant_id: participant?.id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    Sentry.captureException(error, { extra: { photo_id: photoId } });
    logger.error("photo_report_failed", {
      photo_id: photoId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not report photo.",
      },
      { status: 500 },
    );
  }
}
