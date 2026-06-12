import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { assertPinAccessForEventId } from "@/server/pin-guard";
import {
  getPhotoEventId,
  getPhotoLikeCount,
  getPhotoTags,
  setPhotoTag,
} from "@/server/photo-tags";
import { getActiveParticipantForSession } from "@/server/sessions";

type PhotoTagsRouteProps = {
  params: Promise<{
    photoId: string;
  }>;
};

export async function GET(_request: Request, { params }: PhotoTagsRouteProps) {
  const { photoId } = await params;
  const eventId = await getPhotoEventId(photoId);

  if (!eventId) {
    return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  }

  const pinDenied = await assertPinAccessForEventId(eventId);

  if (pinDenied) {
    return pinDenied;
  }

  const [tags, likeCount] = await Promise.all([
    getPhotoTags(photoId),
    getPhotoLikeCount(photoId),
  ]);

  return NextResponse.json({ tags, likeCount });
}

export async function PUT(request: Request, { params }: PhotoTagsRouteProps) {
  const { photoId } = await params;
  const body = (await request.json()) as Partial<{
    participantId: string;
    displayName: string;
    tagged: boolean;
  }>;

  if (!body.participantId || typeof body.tagged !== "boolean") {
    return NextResponse.json(
      { error: "participantId and tagged are required." },
      { status: 400 },
    );
  }

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

  if (!participant) {
    return NextResponse.json(
      { error: "Join the event as a guest before tagging people." },
      { status: 401 },
    );
  }

  try {
    const tags = await setPhotoTag({
      photoId,
      taggedParticipantId: body.participantId,
      taggedByParticipantId: participant.id,
      tagged: body.tagged,
      displayName: body.displayName,
    });

    const likeCount = await getPhotoLikeCount(photoId);

    return NextResponse.json({ tags, likeCount });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not update photo tag.",
      },
      { status: 500 },
    );
  }
}
