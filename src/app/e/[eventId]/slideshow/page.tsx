import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { EventEndedScreen } from "@/components/event-ended-screen";
import { EventPinGate } from "@/components/event-pin-gate";
import { EventSlideshow } from "@/components/slideshow/event-slideshow";
import { getJoinPath } from "@/lib/join";
import { getSlideshowEvent } from "@/server/data";
import { hasPinAccess } from "@/server/pin-access";

type SlideshowPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function SlideshowPage({ params }: SlideshowPageProps) {
  const { eventId } = await params;
  const slideshow = await getSlideshowEvent(eventId);

  if (!slideshow) {
    notFound();
  }

  if (slideshow.event.status === "ended" || slideshow.event.status === "expired") {
    return <EventEndedScreen name={slideshow.event.name} />;
  }

  const cookieStore = await cookies();
  const pinUnlocked =
    !slideshow.event.pinEnabled || hasPinAccess(cookieStore, eventId);

  if (!pinUnlocked) {
    return <EventPinGate event={slideshow.event} />;
  }

  return (
    <EventSlideshow
      event={slideshow.event}
      initialPhotos={slideshow.photos}
      joinPath={getJoinPath()}
    />
  );
}
