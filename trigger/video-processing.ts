import { task } from "@trigger.dev/sdk/v3";
import { processUploadedVideo } from "../src/server/video-jobs";

export const videoProcessingTask = task({
  id: "process-uploaded-video",
  // Videos can be large — allow up to 5 minutes.
  maxDuration: 300,
  run: async (payload: { photoId: string }) => {
    return processUploadedVideo(payload.photoId);
  },
});
