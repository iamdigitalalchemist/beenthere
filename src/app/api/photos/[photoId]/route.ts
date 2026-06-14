import { NextResponse } from "next/server";
import { getEventManagerForApi } from "@/server/auth";
import { getPhotoEventOwner, setPhotoVisibility } from "@/server/data";
import type { PhotoVisibility } from "@/types/domain";

type PhotoRouteProps = {
  params: Promise<{
    photoId: string;
  }>;
};

export async function PATCH(request: Request, { params }: PhotoRouteProps) {
  const { photoId } = await params;
  const photoEvent = await getPhotoEventOwner(photoId);

  if (!photoEvent) {
    return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  }

  const host = await getEventManagerForApi(photoEvent.ownerUserId);

  if (!host.ok) {
    return NextResponse.json({ error: host.error }, { status: host.status });
  }

  const body = (await request.json()) as Partial<{
    visibility: PhotoVisibility;
  }>;

  if (
    body.visibility !== "visible" &&
    body.visibility !== "hidden" &&
    body.visibility !== "deleted"
  ) {
    return NextResponse.json(
      { error: "visibility must be visible, hidden, or deleted." },
      { status: 400 },
    );
  }

  try {
    await setPhotoVisibility({
      photoId,
      visibility: body.visibility,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Photo not found.") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }

  return NextResponse.json({ ok: true });
}
