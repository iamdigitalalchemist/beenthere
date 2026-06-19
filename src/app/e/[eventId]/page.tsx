import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { EventEndedScreen } from "@/components/event-ended-screen";
import { EventPinGate } from "@/components/event-pin-gate";
import { GalleryExperience } from "@/components/gallery-experience";
import { getEventGallery } from "@/server/data";
import { hasPinAccess } from "@/server/pin-access";

type EventGalleryPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export default async function EventGalleryPage({
  params,
}: EventGalleryPageProps) {
  const { eventId } = await params;
  const gallery = await getEventGallery(eventId);

  if (!gallery) {
    notFound();
  }

  if (gallery.event.status === "ended" || gallery.event.status === "expired") {
    return <EventEndedScreen name={gallery.event.name} />;
  }

  const cookieStore = await cookies();
  const pinUnlocked =
    !gallery.event.pinEnabled || hasPinAccess(cookieStore, eventId);

  if (!pinUnlocked) {
    return <EventPinGate event={gallery.event} />;
  }

  return (
    <GalleryExperience
      event={gallery.event}
      initialPhotos={gallery.photos}
      uploaderNames={gallery.uploaderNames}
    />
  );
}
