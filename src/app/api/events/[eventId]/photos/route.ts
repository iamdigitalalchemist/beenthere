import { NextResponse } from "next/server";
import { getEventAccessPolicyById, getEventPhotos } from "@/server/data";
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

  const [gallery, policy] = await Promise.all([
    getEventPhotos(eventId),
    getEventAccessPolicyById(eventId),
  ]);

  // Only cache publicly when the event has no PIN — PIN-gated events must stay private.
  const cacheControl = policy?.pinEnabled
    ? "private, no-store"
    : "public, s-maxage=5, stale-while-revalidate=10";

  return NextResponse.json(gallery, {
    headers: { "Cache-Control": cacheControl },
  });
}
