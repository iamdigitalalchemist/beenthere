import sharp from "sharp";

export type ProcessedPhotoDerivatives = {
  width: number;
  height: number;
  thumbnail: Buffer;
  preview: Buffer;
};

const THUMBNAIL_LONG_EDGE = 480;
const PREVIEW_LONG_EDGE = 2048;

export async function createPhotoDerivatives(
  original: Buffer,
): Promise<ProcessedPhotoDerivatives> {
  const image = sharp(original, {
    failOn: "none",
  }).rotate();

  const metadata = await image.metadata();
  const width = metadata.width ?? 1;
  const height = metadata.height ?? 1;

  const [thumbnail, preview] = await Promise.all([
    image
      .clone()
      .resize({
        width: THUMBNAIL_LONG_EDGE,
        height: THUMBNAIL_LONG_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 75, mozjpeg: true })
      .toBuffer(),
    image
      .clone()
      .resize({
        width: PREVIEW_LONG_EDGE,
        height: PREVIEW_LONG_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer(),
  ]);

  return {
    width,
    height,
    thumbnail,
    preview,
  };
}
