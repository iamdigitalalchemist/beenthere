import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getEventManagerForApi } from "@/server/auth";
import { getEventByPublicId } from "@/server/data";
import { isSecureCookieContext } from "@/server/cookie-policy";
import { updateEventPin, verifyEventPin } from "@/server/data";
import { setPinAccessCookie } from "@/server/pin-access";
import { normalizeEventPin, validateEventPin } from "@/server/pin-policy";

type EventPinRouteProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export async function POST(request: Request, { params }: EventPinRouteProps) {
  const { eventId } = await params;
  const body = (await request.json()) as Partial<{
    pin: string;
  }>;

  if (!body.pin) {
    return NextResponse.json({ error: "PIN is required." }, { status: 400 });
  }

  const isValid = await verifyEventPin(eventId, body.pin);

  if (!isValid) {
    return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
  }

  const cookieStore = await cookies();
  setPinAccessCookie(cookieStore, eventId, {
    secure: isSecureCookieContext(request),
  });

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, { params }: EventPinRouteProps) {
  const { eventId } = await params;
  const event = await getEventByPublicId(eventId);

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const host = await getEventManagerForApi(event.ownerUserId);

  if (!host.ok) {
    return NextResponse.json({ error: host.error }, { status: host.status });
  }

  const body = (await request.json()) as Partial<{
    pin: string | null;
  }>;

  if (!("pin" in body)) {
    return NextResponse.json({ error: "pin is required." }, { status: 400 });
  }

  if (typeof body.pin === "string") {
    const validationError = validateEventPin(body.pin);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
  }

  try {
    const result = await updateEventPin(
      eventId,
      typeof body.pin === "string" ? normalizeEventPin(body.pin) : null,
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not update event PIN.",
      },
      { status: 500 },
    );
  }
}
