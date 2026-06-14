import { task } from "@trigger.dev/sdk/v3";
import { processUploadedPhoto } from "../src/server/photo-jobs";

export const photoProcessingTask = task({
  id: "process-uploaded-photo",
  run: async (payload: { photoId: string }) => {
    return processUploadedPhoto(payload.photoId);
  },
});
