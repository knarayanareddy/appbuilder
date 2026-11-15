/**
 * Phone cameras produce 3–5 MB photos. 100+ of those would be 400 MB of app
 * storage; downscaling to a 1280 px long edge lands around 150–250 KB each and
 * is still more than sharp enough to recognise a frame in a rack.
 */
export const MAX_EDGE = 1280;
export const JPEG_QUALITY = 0.75;

async function loadBitmap(source: Blob): Promise<ImageBitmap | HTMLImageElement | null> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(source);
    } catch {
      /* fall through to <img> */
    }
  }
  if (typeof document === "undefined") return null;
  const url = URL.createObjectURL(source);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not read that image."));
      img.src = url;
    });
  } finally {
    // The decoded image keeps its own copy; safe to release the URL.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

/**
 * Returns a JPEG blob no larger than `maxEdge` on its long side. Never throws:
 * if the device cannot do canvas work, the original blob is stored instead —
 * a big photo is better than a lost one.
 */
export async function downscaleImage(
  source: Blob,
  maxEdge: number = MAX_EDGE,
  quality: number = JPEG_QUALITY
): Promise<Blob> {
  try {
    const bitmap = await loadBitmap(source);
    if (!bitmap) return source;

    const width = "width" in bitmap ? bitmap.width : 0;
    const height = "height" in bitmap ? bitmap.height : 0;
    if (!width || !height) return source;

    const scale = Math.min(1, maxEdge / Math.max(width, height));
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    if (scale === 1 && source.size < 400_000) return source;

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return source;
    ctx.drawImage(bitmap as CanvasImageSource, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise<Blob | null>((resolve) => {
      try {
        canvas.toBlob((result) => resolve(result), "image/jpeg", quality);
      } catch {
        resolve(null);
      }
    });

    if (bitmap instanceof ImageBitmap) bitmap.close();
    return blob ?? source;
  } catch {
    return source;
  }
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}
