import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getParticipantFavoritePhotoIds,
  setParticipantPhotoFavorite,
} from "@/server/favorites";
import { assertPinAccessForEventId } from "@/server/pin-guard";
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

  const pinDenied = await assertPinAccessForEventId(eventId);

  if (pinDenied) {
    return pinDenied;
  }

  const participant = await getActiveParticipantForSession({
    eventId,
    cookies: await cookies(),
  });

  if (!participant) {
    return NextResponse.json({ photoIds: [] });
  }

  try {
    const photoIds = await getParticipantFavoritePhotoIds(participant.id);

    return NextResponse.json({ photoIds });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not load favorites.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const body = (await request.json()) as Partial<{
    eventId: string;
    photoId: string;
    saved: boolean;
  }>;

  if (!body.eventId || !body.photoId || typeof body.saved !== "boolean") {
    return NextResponse.json(
      { error: "eventId, photoId, and saved are required." },
      { status: 400 },
    );
  }

  const pinDenied = await assertPinAccessForEventId(body.eventId);

  if (pinDenied) {
    return pinDenied;
  }

  const participant = await getActiveParticipantForSession({
    eventId: body.eventId,
    cookies: await cookies(),
  });

  if (!participant) {
    return NextResponse.json(
      { error: "Join the event as a guest before saving photos." },
      { status: 401 },
    );
  }

  try {
    await setParticipantPhotoFavorite({
      participantId: participant.id,
      photoId: body.photoId,
      saved: body.saved,
    });

    const photoIds = await getParticipantFavoritePhotoIds(participant.id);

    return NextResponse.json({ photoIds });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not update favorite.",
      },
      { status: 500 },
    );
  }
}
