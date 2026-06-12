import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getEventAccessPolicyById,
  getEventAccessPolicyByPublicId,
} from "@/server/data";
import { hasPinAccess } from "@/server/pin-access";

export async function assertPinAccessForPublicId(publicId: string) {
  const policy = await getEventAccessPolicyByPublicId(publicId);

  if (!policy?.pinEnabled) {
    return null;
  }

  if (hasPinAccess(await cookies(), publicId)) {
    return null;
  }

  return NextResponse.json({ error: "PIN required." }, { status: 401 });
}

export async function assertPinAccessForEventId(eventId: string) {
  const policy = await getEventAccessPolicyById(eventId);

  if (!policy?.pinEnabled) {
    return null;
  }

  if (hasPinAccess(await cookies(), policy.publicId)) {
    return null;
  }

  return NextResponse.json({ error: "PIN required." }, { status: 401 });
}
