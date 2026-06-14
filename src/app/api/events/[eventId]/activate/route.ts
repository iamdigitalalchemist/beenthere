import { NextResponse } from "next/server";
import { getEventManagerForApi } from "@/server/auth";
import { checkHostEntitlement } from "@/server/billing";
import { activateEvent, getEventByPublicId } from "@/server/data";

type EventActivateRouteProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export async function POST(
  _request: Request,
  { params }: EventActivateRouteProps,
) {
  const { eventId: publicId } = await params;
  const event = await getEventByPublicId(publicId);

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const auth = await getEventManagerForApi(event.ownerUserId);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (event.status === "active") {
    return NextResponse.json({ event });
  }

  const entitlement = await checkHostEntitlement(auth.user);

  if (!entitlement.entitled) {
    return NextResponse.json(
      {
        error:
          entitlement.reason === "billing_not_configured"
            ? "Billing is not configured yet. Contact the BeenThere team."
            : "An active BeenThere plan is required to take an event live.",
        code: "payment_required",
      },
      { status: 402 },
    );
  }

  const activated = await activateEvent(publicId);

  return NextResponse.json({ event: activated });
}
