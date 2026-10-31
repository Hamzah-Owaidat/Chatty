import { FileKind } from '@/types/file.models';
import { getFileKind } from './file';

// WhatsApp-style pre-download placeholder: a tiny, heavily compressed JPEG of a photo or
// a video frame. The recipient's client blurs it with CSS until the real file is
// downloaded. Kept well under the server's cap (Constant.FileUpload.MaxPreviewBytes, 4 KB).
const PREVIEW_MAX_SIDE = 32;
const PREVIEW_QUALITY = 0.5;
const VIDEO_FRAME_TIMEOUT_MS = 4000;

/** Returns the preview as base64 (no data: prefix), or undefined for other files / on failure. */
export async function createPreview(file: File): Promise<string | undefined> {
  try {
    const kind = getFileKind(file.type);
    if (kind === FileKind.Image) return toJpegBase64(await createImageBitmap(file));
    if (kind === FileKind.Video) return toJpegBase64(await grabVideoFrame(file));
  } catch (err) {
    // A preview is cosmetic — never block a send over it.
    console.warn(`Couldn't create a preview for "${file.name}":`, err);
  }
  return undefined;
}

function toJpegBase64(source: ImageBitmap | HTMLVideoElement): string | undefined {
  const width = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
  const height = source instanceof HTMLVideoElement ? source.videoHeight : source.height;
  if (!width || !height) return undefined;

  const scale = Math.min(1, PREVIEW_MAX_SIDE / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  canvas.getContext('2d')?.drawImage(source, 0, 0, canvas.width, canvas.height);

  if (source instanceof ImageBitmap) source.close();

  return canvas.toDataURL('image/jpeg', PREVIEW_QUALITY).split(',')[1];
}

// Loads the video off-screen and grabs a frame a little way in (the very first frame is
// often black).
function grabVideoFrame(file: File): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    const finish = (result: () => void) => {
      clearTimeout(timeout);
      result();
      // Released after drawing — the caller draws synchronously right after resolve.
      setTimeout(() => URL.revokeObjectURL(url), 0);
    };

    const timeout = setTimeout(() => finish(() => reject(new Error('timed out'))), VIDEO_FRAME_TIMEOUT_MS);

    video.onloadeddata = () => {
      // In-browser recordings may report no duration — then just take an early frame.
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      video.currentTime = duration > 0 ? Math.min(1, duration / 3) : 0.1;
    };
    video.onseeked = () => finish(() => resolve(video));
    video.onerror = () => finish(() => reject(video.error ?? new Error('could not load video')));

    video.src = url;
  });
}
