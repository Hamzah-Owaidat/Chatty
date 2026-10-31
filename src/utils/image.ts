// Profile images (avatar, group image, background banner) are transcoded to WebP and capped
// at this size client-side before upload — smaller, uniform payloads for faster loads.
export const PROFILE_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

// Progressively smaller long-edge dimensions, tried alongside quality steps until the
// encoded WebP lands under the size cap.
const DIMENSION_STEPS = [1920, 1600, 1280, 1024, 800];
const QUALITY_STEPS = [0.85, 0.7, 0.55, 0.4];

export class ImageConversionError extends Error {}

const toWebpFileName = (originalName: string): string => {
  const base = originalName.replace(/\.[^./\\]+$/, "");
  return `${base || "image"}.webp`;
};

const scaleDown = (width: number, height: number, maxDimension: number) => {
  const longest = Math.max(width, height);
  if (longest <= maxDimension) return { width, height };
  const scale = maxDimension / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
};

const encode = (canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));

async function loadImageSource(file: File): Promise<CanvasImageSource & { width: number; height: number; close?: () => void }> {
  if ("createImageBitmap" in window) {
    return createImageBitmap(file);
  }

  // Fallback for browsers without createImageBitmap.
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageConversionError(`Couldn't read "${file.name}" as an image.`));
    };
    img.src = url;
  });
}

/**
 * Transcodes a picked image to WebP, downscaling and stepping down quality as needed to land
 * under maxBytes. Falls back to returning the original file untouched if this browser's
 * canvas silently refuses WebP encoding (older Safari). Throws ImageConversionError only if
 * WebP encoding IS supported but still can't get under the cap even at the lowest settings.
 */
export async function convertToWebP(file: File, maxBytes: number = PROFILE_IMAGE_MAX_BYTES): Promise<File> {
  if (file.type === "image/webp" && file.size <= maxBytes) return file;

  const source = await loadImageSource(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return file; // no canvas support — upload the original, server still enforces limits

  try {
    for (const maxDimension of DIMENSION_STEPS) {
      const { width, height } = scaleDown(source.width, source.height, maxDimension);
      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(source, 0, 0, width, height);

      for (const quality of QUALITY_STEPS) {
        const blob = await encode(canvas, quality);
        if (!blob) continue;
        // Some browsers (older Safari) silently ignore the requested MIME type and hand back
        // a PNG instead — treat that as "WebP unsupported here" and just use the original.
        if (blob.type !== "image/webp") return file;
        if (blob.size <= maxBytes) return new File([blob], toWebpFileName(file.name), { type: "image/webp" });
      }
    }
  } finally {
    source.close?.();
  }

  throw new ImageConversionError(`"${file.name}" is still too large after compression — try a smaller or simpler image.`);
}
