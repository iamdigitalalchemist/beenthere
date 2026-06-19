import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  createLocalMediaUrl,
  isLocalMediaKey,
  readLocalMediaBuffer,
  writeLocalMediaBuffer,
} from "@/server/local-media";
import { getR2Env } from "@/server/env";

const SIGNED_UPLOAD_TTL_SECONDS = 10 * 60;
const SIGNED_READ_TTL_SECONDS = 15 * 60;

// Signed URL in-memory cache: key → { url, expiresAt }
// TTL is slightly shorter than the actual signed URL to avoid serving near-expired URLs.
const CACHE_TTL_MS = (SIGNED_READ_TTL_SECONDS - 60) * 1000;
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

// Singleton S3Client — reused across all invocations in the same process.
let _r2Client: { bucketName: string; client: S3Client } | undefined;

export function createR2Client() {
  if (_r2Client) return _r2Client;

  const env = getR2Env();

  if (!env.configured) {
    throw new Error(`Missing R2 configuration: ${env.missing.join(", ")}`);
  }

  _r2Client = {
    bucketName: env.bucketName,
    client: new S3Client({
      region: "auto",
      endpoint: `https://${env.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.accessKeyId,
        secretAccessKey: env.secretAccessKey,
      },
    }),
  };
  return _r2Client;
}

export async function createSignedPhotoUploadUrl(input: {
  objectKey: string;
  contentType: string;
}) {
  const { bucketName, client } = createR2Client();

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: input.objectKey,
    ContentType: input.contentType,
  });

  return getSignedUrl(client, command, {
    expiresIn: SIGNED_UPLOAD_TTL_SECONDS,
  });
}

export async function createSignedPhotoReadUrl(objectKey: string) {
  if (isLocalMediaKey(objectKey)) {
    return createLocalMediaUrl(objectKey);
  }

  // When a public CDN URL is configured (R2 public bucket or custom domain),
  // skip signing entirely — Cloudflare serves and caches the file directly.
  const publicBase = process.env.R2_PUBLIC_URL;
  if (publicBase) {
    return `${publicBase.replace(/\/$/, "")}/${objectKey}`;
  }

  const cached = signedUrlCache.get(objectKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  const { bucketName, client } = createR2Client();

  const url = await getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    }),
    {
      expiresIn: SIGNED_READ_TTL_SECONDS,
    },
  );

  signedUrlCache.set(objectKey, { url, expiresAt: Date.now() + CACHE_TTL_MS });

  // Evict entries that have expired to prevent unbounded growth.
  if (signedUrlCache.size > 5000) {
    const now = Date.now();
    for (const [k, v] of signedUrlCache) {
      if (v.expiresAt <= now) signedUrlCache.delete(k);
    }
  }

  return url;
}

export async function getR2ObjectBuffer(objectKey: string) {
  if (isLocalMediaKey(objectKey)) {
    return readLocalMediaBuffer(objectKey);
  }

  const { bucketName, client } = createR2Client();

  const response = await client.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    }),
  );

  if (!response.Body) {
    throw new Error(`R2 object has no body: ${objectKey}`);
  }

  const body = await response.Body.transformToByteArray();
  return Buffer.from(body);
}

export async function streamR2ObjectToFile(objectKey: string, destPath: string) {
  if (isLocalMediaKey(objectKey)) {
    const buf = await readLocalMediaBuffer(objectKey);
    const { writeFile } = await import("node:fs/promises");
    await writeFile(destPath, buf);
    return;
  }

  const { bucketName, client } = createR2Client();
  const response = await client.send(
    new GetObjectCommand({ Bucket: bucketName, Key: objectKey }),
  );

  if (!response.Body) {
    throw new Error(`R2 object has no body: ${objectKey}`);
  }

  const { createWriteStream } = await import("node:fs");
  const { pipeline } = await import("node:stream/promises");
  const writer = createWriteStream(destPath);
  await pipeline(response.Body as unknown as NodeJS.ReadableStream, writer);
}

export async function putR2Object(input: {
  objectKey: string;
  body: Buffer;
  contentType: string;
}) {
  if (isLocalMediaKey(input.objectKey)) {
    await writeLocalMediaBuffer(input);
    return;
  }

  const { bucketName, client } = createR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: input.objectKey,
      Body: input.body,
      ContentType: input.contentType,
    }),
  );
}
