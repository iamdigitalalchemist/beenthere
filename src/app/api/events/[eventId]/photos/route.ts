import { NextResponse } from "next/server";
import { getEventPhotos } from "@/server/data";
import { assertPinAccessForEventId } from "@/server/pin-guard";

type EventPhotosRouteProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export async function GET(_request: Request, { params }: EventPhotosRouteProps) {
  const { eventId } = await params;
  const pinDenied = await assertPinAccessForEventId(eventId);

  if (pinDenied) {
    return pinDenied;
  }

  const gallery = await getEventPhotos(eventId);

  return NextResponse.json(gallery);
}
