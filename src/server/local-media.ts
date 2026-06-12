import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const LOCAL_MEDIA_PREFIX = "local-media/";

export function isLocalMediaKey(objectKey: string) {
  return objectKey.startsWith(LOCAL_MEDIA_PREFIX);
}

function getLocalMediaPath(objectKey: string) {
  if (!isLocalMediaKey(objectKey)) {
    throw new Error(`Not a local media key: ${objectKey}`);
  }

  return path.join(process.cwd(), "public", objectKey);
}

export function createLocalMediaKey(objectKey: string) {
  return `${LOCAL_MEDIA_PREFIX}${objectKey}`;
}

export function createLocalMediaUrl(objectKey: string) {
  return `/${objectKey}`;
}

export async function readLocalMediaBuffer(objectKey: string) {
  return readFile(getLocalMediaPath(objectKey));
}

export async function writeLocalMediaBuffer(input: {
  objectKey: string;
  body: Buffer;
}) {
  const mediaPath = getLocalMediaPath(input.objectKey);

  await mkdir(path.dirname(mediaPath), { recursive: true });
  await writeFile(mediaPath, input.body);
}
