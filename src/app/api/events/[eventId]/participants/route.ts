import { NextResponse } from "next/server";
import { getEventParticipants } from "@/server/photo-tags";
import { assertPinAccessForEventId } from "@/server/pin-guard";

type EventParticipantsRouteProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export async function GET(_request: Request, { params }: EventParticipantsRouteProps) {
  const { eventId } = await params;
  const pinDenied = await assertPinAccessForEventId(eventId);

  if (pinDenied) {
    return pinDenied;
  }

  const participants = await getEventParticipants(eventId);

  return NextResponse.json({ participants });
}
