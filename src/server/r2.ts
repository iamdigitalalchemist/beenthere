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

export function createR2Client() {
  const env = getR2Env();

  if (!env.configured) {
    throw new Error(`Missing R2 configuration: ${env.missing.join(", ")}`);
  }

  return {
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

  const { bucketName, client } = createR2Client();

  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    }),
    {
      expiresIn: SIGNED_READ_TTL_SECONDS,
    },
  );
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
