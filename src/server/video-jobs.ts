import ffmpeg from "fluent-ffmpeg";
import { getDatabasePool } from "@/server/db";

// The @trigger.dev/build ffmpeg extension sets FFMPEG_PATH/FFPROBE_PATH in the worker.
// fluent-ffmpeg reads these automatically, but set them explicitly as a belt-and-suspenders.
if (process.env.FFMPEG_PATH) ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
if (process.env.FFPROBE_PATH) ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
import { createLocalMediaKey, isLocalMediaKey } from "@/server/local-media";
import {
  createSignedPhotoReadUrl,
  streamR2ObjectToFile,
  putR2Object,
} from "@/server/r2";
import { createVideoDerivativeKeys } from "@/server/storage-paths";
import { logger } from "@/server/logger";
import type { PhotoRecord } from "@/types/domain";
import * as os from "os";
import * as path from "path";
import * as fs from "fs/promises";

type VideoJobRow = {
  id: string;
  event_id: string;
  event_participant_id: string;
  original_key: string;
  original_file_name: string;
  original_content_type: string;
  original_size_bytes: number;
};

function toIsoString(value: string | Date) {
  return value instanceof Date ? value.toISOString() : value;
}

function toNumber(value: string | number) {
  return typeof value === "string" ? Number(value) : value;
}

async function extractPosterFrame(videoPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .on("error", (err: Error) => reject(err))
      .on("end", () => resolve())
      .screenshots({
        count: 1,
        timemarks: ["1"],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: "1280x?",
      });
  });
}

async function transcodeToMp4(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec("libx264")
      .audioCodec("aac")
      // Scale to max 1280px wide, keeping aspect ratio, divisible by 2 (required by libx264)
      .videoFilters("scale='min(1280,iw)':'trunc(ow/a/2)*2'")
      .outputOptions([
        "-crf 23",
        "-preset fast",
        "-movflags +faststart", // moov atom at front for streaming
        "-pix_fmt yuv420p",     // broad browser compatibility
      ])
      .on("error", (err: Error) => reject(err))
      .on("end", () => resolve())
      .save(outputPath);
  });
}

export async function processUploadedVideo(photoId: string): Promise<PhotoRecord> {
  const pool = getDatabasePool();
  const t0 = Date.now();

  if (!pool) {
    throw new Error("POSTGRES_URL is not configured.");
  }

  const photoResult = await pool.query<VideoJobRow>(
    `select id, event_id, event_participant_id, original_key,
            original_file_name, original_content_type, original_size_bytes
       from beenthere.photos
      where id = $1
      limit 1`,
    [photoId],
  );
  const photoRow = photoResult.rows[0];

  if (!photoRow) {
    logger.error("video_processing_not_found", { photo_id: photoId });
    throw new Error("Photo not found.");
  }

  logger.info("video_processing_start", { photo_id: photoId, event_id: photoRow.event_id });

  await pool.query(
    `update beenthere.photos set status = 'processing' where id = $1`,
    [photoId],
  );

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "bt-video-"));
  const videoPath = path.join(tmpDir, "original");
  const posterPath = path.join(tmpDir, "poster.jpg");
  const mp4Path = path.join(tmpDir, "playback.mp4");

  try {
    await streamR2ObjectToFile(photoRow.original_key, videoPath);

    // Run poster extraction and transcoding in parallel.
    await Promise.all([
      extractPosterFrame(videoPath, posterPath),
      transcodeToMp4(videoPath, mp4Path),
    ]);

    const [posterBuffer, mp4Buffer] = await Promise.all([
      fs.readFile(posterPath),
      fs.readFile(mp4Path),
    ]);

    const derivativeKeys = createVideoDerivativeKeys({
      eventId: photoRow.event_id,
      photoId: photoRow.id,
    });
    const isLocal = isLocalMediaKey(photoRow.original_key);
    const posterKey = isLocal
      ? createLocalMediaKey(derivativeKeys.posterKey)
      : derivativeKeys.posterKey;
    const playbackKey = isLocal
      ? createLocalMediaKey(derivativeKeys.playbackKey)
      : derivativeKeys.playbackKey;

    await Promise.all([
      putR2Object({ objectKey: posterKey, body: posterBuffer, contentType: "image/jpeg" }),
      putR2Object({ objectKey: playbackKey, body: mp4Buffer, contentType: "video/mp4" }),
    ]);

    const updateResult = await pool.query<{
        id: string;
        event_id: string;
        event_participant_id: string;
        status: PhotoRecord["status"];
        visibility: PhotoRecord["visibility"];
        in_gallery: boolean;
        original_key: string;
        original_file_name: string;
        original_content_type: string;
        original_size_bytes: number;
        media_type: PhotoRecord["mediaType"];
        width: number | null;
        height: number | null;
        uploaded_at: string;
        taken_at: string | null;
      }>(
      `update beenthere.photos
          set status = 'ready',
              thumbnail_key = $2,
              preview_key = $2,
              playback_key = $3
        where id = $1
        returning id, event_id, event_participant_id, status, visibility, in_gallery,
                  original_key, original_file_name, original_content_type,
                  original_size_bytes, media_type, width, height, uploaded_at, taken_at`,
      [photoId, posterKey, playbackKey],
    );
    const updatedPhoto = updateResult.rows[0];

    if (!updatedPhoto) {
      throw new Error("Failed to update photo.");
    }

    const posterUrl = await createSignedPhotoReadUrl(posterKey);

    logger.info("video_processing_complete", {
      photo_id: photoId,
      event_id: updatedPhoto.event_id,
      duration_ms: Date.now() - t0,
    });

    return {
      id: updatedPhoto.id,
      eventId: updatedPhoto.event_id,
      participantId: updatedPhoto.event_participant_id,
      status: updatedPhoto.status,
      visibility: updatedPhoto.visibility,
      inGallery: updatedPhoto.in_gallery,
      originalKey: updatedPhoto.original_key,
      thumbnailUrl: posterUrl,
      previewUrl: posterUrl,
      originalFileName: updatedPhoto.original_file_name,
      originalContentType: updatedPhoto.original_content_type,
      originalSizeBytes: toNumber(updatedPhoto.original_size_bytes),
      mediaType: "video" as const,
      width: updatedPhoto.width ?? 1,
      height: updatedPhoto.height ?? 1,
      uploadedAt: toIsoString(updatedPhoto.uploaded_at),
      takenAt: updatedPhoto.taken_at ? toIsoString(updatedPhoto.taken_at) : undefined,
    };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}
