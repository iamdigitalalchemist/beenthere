import { defineConfig } from "@trigger.dev/sdk/v3";
import { ffmpeg } from "@trigger.dev/build/extensions/core";

export default defineConfig({
  project: "proj_wawlbsqmyjohdgqrmqcf",
  dirs: ["./trigger"],
  maxDuration: 300,
  build: {
    extensions: [ffmpeg()],
  },
});
