import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createProfilePhotoObjectKey,
  readUploadedProfilePhotoBuffer,
  resolveProfilePhotoUrl,
  storeProfilePhoto,
} from "@/server/participant-profile";
import { assertPinAccessForEventId } from "@/server/pin-guard";
import {
  getActiveParticipantForSession,
  setParticipantProfilePhotoKey,
} from "@/server/sessions";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<{
    eventId: string;
    participantId: string;
    objectKey: string;
  }>;

  if (!body.eventId || !body.participantId || !body.objectKey) {
    return NextResponse.json(
      { error: "eventId, participantId, and objectKey are required." },
      { status: 400 },
    );
  }

  const pinDenied = await assertPinAccessForEventId(body.eventId);

  if (pinDenied) {
    return pinDenied;
  }

  const cookieStore = await cookies();
  const participant = await getActiveParticipantForSession({
    eventId: body.eventId,
    cookies: cookieStore,
  });

  if (!participant || participant.id !== body.participantId) {
    return NextResponse.json(
      { error: "Guest session does not match this participant." },
      { status: 403 },
    );
  }

  try {
    const uploadedBuffer = await readUploadedProfilePhotoBuffer(body.objectKey);
    const finalObjectKey = createProfilePhotoObjectKey({
      eventId: body.eventId,
      participantId: body.participantId,
    });
    const storedObjectKey = await storeProfilePhoto({
      objectKey: finalObjectKey,
      body: uploadedBuffer,
    });
    const updatedParticipant = await setParticipantProfilePhotoKey({
      participantId: body.participantId,
      profilePhotoKey: storedObjectKey,
      cookies: cookieStore,
    });

    return NextResponse.json({
      participant: updatedParticipant,
      profilePhotoUrl: await resolveProfilePhotoUrl(storedObjectKey),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not process profile photo.",
      },
      { status: 500 },
    );
  }
}
