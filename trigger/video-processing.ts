import { task, logger } from "@trigger.dev/sdk/v3";
import { processUploadedVideo } from "../src/server/video-jobs";

export const videoProcessingTask = task({
  id: "process-uploaded-video",
  maxDuration: 300,
  retry: { maxAttempts: 2 },
  machine: { preset: "medium-1x" },
  run: async (payload: { photoId: string }) => {
    logger.info("video task start", {
      photoId: payload.photoId,
      ffmpegPath: process.env.FFMPEG_PATH ?? "not set",
      ffprobePath: process.env.FFPROBE_PATH ?? "not set",
    });
    return processUploadedVideo(payload.photoId);
  },
});
