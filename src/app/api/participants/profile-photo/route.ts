import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getR2Env, isLocalUploadStorageEnabled } from "@/server/env";
import { createLocalMediaKey } from "@/server/local-media";
import { createProfilePhotoObjectKey } from "@/server/participant-profile";
import { createSignedPhotoUploadUrl } from "@/server/r2";
import { assertPinAccessForEventId } from "@/server/pin-guard";
import { getActiveParticipantForSession } from "@/server/sessions";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<{
    eventId: string;
    participantId: string;
    contentType: string;
  }>;

  if (!body.eventId || !body.participantId || !body.contentType) {
    return NextResponse.json(
      { error: "eventId, participantId, and contentType are required." },
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

  if (!participant || participant.id !== body.participantId) {
    return NextResponse.json(
      { error: "Guest session does not match this participant." },
      { status: 403 },
    );
  }

  const r2Env = getR2Env();
  const useLocalStorage = !r2Env.configured && isLocalUploadStorageEnabled();

  if (!r2Env.configured && !useLocalStorage) {
    return NextResponse.json(
      {
        error:
          "Profile photo uploads require R2 or LOCAL_UPLOADS_ENABLED=true.",
      },
      { status: 501 },
    );
  }

  const baseObjectKey = createProfilePhotoObjectKey({
    eventId: body.eventId,
    participantId: body.participantId,
  });
  const objectKey = useLocalStorage
    ? createLocalMediaKey(`${baseObjectKey}.upload`)
    : `${baseObjectKey}.upload`;
  const uploadUrl = useLocalStorage
    ? `/api/uploads/local?objectKey=${encodeURIComponent(objectKey)}`
    : await createSignedPhotoUploadUrl({
        objectKey,
        contentType: body.contentType,
      });

  return NextResponse.json({
    uploadUrl,
    objectKey,
    method: "PUT",
    headers: {
      "Content-Type": body.contentType,
    },
  });
}
