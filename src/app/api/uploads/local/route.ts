import { NextResponse } from "next/server";
import { isLocalUploadStorageEnabled } from "@/server/env";
import { isLocalMediaKey, writeLocalMediaBuffer } from "@/server/local-media";

export async function PUT(request: Request) {
  if (!isLocalUploadStorageEnabled()) {
    return NextResponse.json(
      { error: "Local uploads are disabled." },
      { status: 403 },
    );
  }

  const url = new URL(request.url);
  const objectKey = url.searchParams.get("objectKey");

  if (!objectKey || !isLocalMediaKey(objectKey)) {
    return NextResponse.json(
      { error: "A valid local objectKey is required." },
      { status: 400 },
    );
  }

  const body = Buffer.from(await request.arrayBuffer());
  await writeLocalMediaBuffer({ objectKey, body });

  return NextResponse.json({ ok: true });
}
