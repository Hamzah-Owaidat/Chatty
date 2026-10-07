"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Loader2, RefreshCcw, RotateCcw, Send, Video, X } from "lucide-react";
import { maxFileSizeLabel, validateFile } from "@/utils/file";
import { useUploadLimits } from "@/hooks/useUploadLimits";

type CaptureMode = "photo" | "video";

interface CapturedMedia {
  file: File;
  url: string;
  mode: CaptureMode;
}

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Uploads + sends the capture; resolves true on success (the modal then closes).
  onSend: (file: File, caption: string, onProgress: (percent: number) => void) => Promise<boolean>;
}

const MAX_VIDEO_SECONDS = 60;
// Keeps a minute of video comfortably under the upload size limit.
const VIDEO_BITS_PER_SECOND = 1_000_000;

// Formats the server accepts (video/mp4, video/webm) — first one the browser can record wins.
const RECORDER_TYPES = [
  "video/mp4;codecs=avc1,mp4a",
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
];

const pickRecorderType = () =>
  typeof MediaRecorder === "undefined" ? undefined : RECORDER_TYPES.find((t) => MediaRecorder.isTypeSupported(t));

// Remembered camera choice — per browser, so it's a convenience only; storage can be
// unavailable (private mode, blocked site data), in which case the browser just picks.
const CAMERA_STORAGE_KEY = "chatty.cameraDeviceId";

function readStoredCamera(): string | null {
  try {
    return localStorage.getItem(CAMERA_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeCamera(deviceId: string | null) {
  try {
    if (deviceId) localStorage.setItem(CAMERA_STORAGE_KEY, deviceId);
    else localStorage.removeItem(CAMERA_STORAGE_KEY);
  } catch {
    // Not remembered — the user can switch again next time.
  }
}

export const isCameraSupported = () =>
  typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

function describeCameraError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "Camera access was blocked. Allow it in your browser's site settings and try again.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "No camera was found on this device.";
  if (name === "NotReadableError") return "The camera is being used by another app.";
  return "Couldn't start the camera.";
}

/**
 * Chrome's MediaRecorder writes WebM without a duration, so the player shows a broken
 * timeline. Seeking far past the end makes the browser scan the file and work it out;
 * then jump back to the start.
 */
function fixMissingDuration(e: React.SyntheticEvent<HTMLVideoElement>) {
  const video = e.currentTarget;
  if (video.duration !== Infinity) return;

  const restore = () => {
    video.removeEventListener("timeupdate", restore);
    video.currentTime = 0;
  };
  video.addEventListener("timeupdate", restore);
  video.currentTime = Number.MAX_SAFE_INTEGER;
}

const formatSeconds = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/**
 * In-app camera, WhatsApp-style: live preview, photo or video mode, front/back switch,
 * then a review screen to retake or send with a caption. Uses getUserMedia + a canvas
 * for photos and MediaRecorder for videos.
 */
export default function CameraCaptureModal({ isOpen, onClose, onSend }: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const [mode, setMode] = useState<CaptureMode>("photo");
  // A chosen camera, by device id. Null = let the browser pick (back camera on phones).
  const [deviceId, setDeviceId] = useState<string | null>(readStoredCamera);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [mirrored, setMirrored] = useState(false);
  // The camera actually streaming — the browser may have picked it, so it can differ from deviceId.
  const activeDeviceIdRef = useRef<string | undefined>(undefined);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [captured, setCaptured] = useState<CapturedMedia | null>(null);
  const [caption, setCaption] = useState("");
  const [sendProgress, setSendProgress] = useState<number | null>(null);
  const uploadLimits = useUploadLimits();

  // Live stream: (re)acquired when opened, on mode/camera switch, and after a retake;
  // released while reviewing a capture and on close, so the camera light goes off.
  useEffect(() => {
    if (!isOpen || captured) return;

    let cancelled = false;
    let acquired: MediaStream | null = null;
    setError(null);

    (async () => {
      const video: MediaTrackConstraints = {
        // facingMode only means something on phones — laptop webcams ignore it, so
        // switching cameras has to go by device id to reach e.g. the real webcam
        // instead of a virtual one.
        ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: "environment" }),
        width: { ideal: 1280 },
        height: { ideal: 720 },
      };
      try {
        try {
          acquired = await navigator.mediaDevices.getUserMedia({ video, audio: mode === "video" });
        } catch (err) {
          // The remembered camera is gone (unplugged, virtual camera uninstalled) — let the browser pick.
          if (deviceId && err instanceof DOMException && (err.name === "OverconstrainedError" || err.name === "NotFoundError")) {
            if (!cancelled) {
              storeCamera(null);
              setDeviceId(null);
            }
            return;
          }
          // No microphone (or mic denied) shouldn't block silent video.
          if (mode !== "video") throw err;
          acquired = await navigator.mediaDevices.getUserMedia({ video, audio: false });
        }

        if (cancelled) {
          acquired.getTracks().forEach((t) => t.stop());
          return;
        }
        const settings = acquired.getVideoTracks()[0]?.getSettings();
        activeDeviceIdRef.current = settings?.deviceId;
        setMirrored(settings?.facingMode === "user");
        setStream(acquired);

        // Device labels/ids are only fully exposed once permission is granted, so list after.
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled) setCameras(devices.filter((d) => d.kind === "videoinput" && d.deviceId));
      } catch (err) {
        if (!cancelled) setError(describeCameraError(err));
      }
    })();

    return () => {
      cancelled = true;
      acquired?.getTracks().forEach((t) => t.stop());
      setStream(null);
    };
  }, [isOpen, mode, deviceId, captured]);

  const canSwitch = cameras.length > 1;

  // Cycle to the next camera and remember it, so a working pick sticks across sessions.
  const switchCamera = () => {
    if (!canSwitch) return;
    const current = cameras.findIndex((c) => c.deviceId === activeDeviceIdRef.current);
    const next = cameras[(current + 1) % cameras.length].deviceId;
    storeCamera(next);
    setDeviceId(next);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  const stopRecording = useCallback(() => {
    clearInterval(timerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  // Abandon an in-progress recording without producing a capture (on close/unmount).
  const discardRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onstop = null;
    }
    stopRecording();
    recorderRef.current = null;
  }, [stopRecording]);

  const reset = useCallback(() => {
    discardRecording();
    setRecording(false);
    setElapsed(0);
    setCaption("");
    setSendProgress(null);
    setCaptured((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
  }, [discardRecording]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && sendProgress === null && handleClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, handleClose, sendProgress]);

  // Never leave the camera on or a recorder running if the chat unmounts mid-capture.
  useEffect(() => () => discardRecording(), [discardRecording]);

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
        setCaptured({ file, url: URL.createObjectURL(file), mode: "photo" });
      },
      "image/jpeg",
      0.9
    );
  };

  const startRecording = () => {
    const mimeType = pickRecorderType();
    if (!stream || !mimeType) {
      setError("Video recording isn't supported in this browser.");
      return;
    }

    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: VIDEO_BITS_PER_SECOND });
    const chunks: Blob[] = [];
    let bytes = 0;

    recorder.ondataavailable = (e) => {
      if (e.data.size === 0) return;
      chunks.push(e.data);
      bytes += e.data.size;
      // Stop before the file would exceed the upload limit.
      if (uploadLimits && bytes > uploadLimits.maxFileSizeBytes * 0.92) stopRecording();
    };

    recorder.onstop = () => {
      setRecording(false);
      // The server compares the bare MIME type ("video/webm"), so drop codec parameters.
      const type = (recorder.mimeType || mimeType).split(";")[0];
      const file = new File(chunks, `video-${Date.now()}.${type === "video/mp4" ? "mp4" : "webm"}`, { type });
      if (file.size > 0) setCaptured({ file, url: URL.createObjectURL(file), mode: "video" });
    };

    recorderRef.current = recorder;
    recorder.start(1000); // emit a chunk every second so the size guard can react
    setRecording(true);
    setElapsed(0);

    const startedAt = Date.now();
    timerRef.current = setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000);
      setElapsed(seconds);
      if (seconds >= MAX_VIDEO_SECONDS) stopRecording();
    }, 250);
  };

  const handleShutter = () => {
    if (mode === "photo") takePhoto();
    else if (recording) stopRecording();
    else startRecording();
  };

  const handleSend = async () => {
    if (!captured) return;

    const invalid = validateFile(captured.file, uploadLimits);
    if (invalid) {
      setError(invalid);
      return;
    }

    setSendProgress(0);
    const ok = await onSend(captured.file, caption.trim(), setSendProgress);
    if (ok) handleClose();
    else setSendProgress(null);
  };

  if (!isOpen) return null;

  const sending = sendProgress !== null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex flex-col bg-black text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={handleClose}
          disabled={sending}
          aria-label="Close camera"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>
        {recording && (
          <span className="flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-sm font-medium tabular-nums">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-error-500" />
            {formatSeconds(elapsed)} / {formatSeconds(MAX_VIDEO_SECONDS)}
          </span>
        )}
        {!captured && canSwitch && !recording ? (
          <button
            type="button"
            onClick={switchCamera}
            aria-label="Switch camera"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          >
            <RefreshCcw className="h-5 w-5" />
          </button>
        ) : (
          <span className="h-10 w-10" />
        )}
      </div>

      {/* Viewfinder / review */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        {/* Distinct keys: both are <video>s in the same spot, and if React reused the live
            one for review, its leftover camera srcObject would override the recording's src. */}
        {captured ? (
          captured.mode === "photo" ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob: URL
            <img key="review-photo" src={captured.url} alt="Captured photo" className="max-h-full max-w-full object-contain" />
          ) : (
            <video
              key="review-video"
              src={captured.url}
              controls
              autoPlay
              playsInline
              onLoadedMetadata={fixMissingDuration}
              className="max-h-full max-w-full"
            />
          )
        ) : (
          <video
            key="live"
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`max-h-full max-w-full object-contain ${mirrored ? "-scale-x-100" : ""}`}
          />
        )}

        {!captured && !stream && !error && <Loader2 className="absolute h-8 w-8 animate-spin opacity-70" />}

        {error && (
          <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 rounded-2xl bg-black/70 p-4 text-center text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Controls */}
      {captured ? (
        <div className="flex flex-col gap-3 px-4 pb-6 pt-3">
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !sending && handleSend()}
            placeholder="Add a caption..."
            disabled={sending}
            className="w-full rounded-full bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/50 outline-none focus:ring-2 focus:ring-[#60c7e3]/50 disabled:opacity-60"
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={reset}
              disabled={sending}
              className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm font-medium hover:bg-white/20 disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" /> Retake
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={sending}
              aria-label="Send"
              className="flex h-12 min-w-12 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#1f88aa] via-[#1a7b9b] to-[#17708d] px-4 font-medium shadow-[0_10px_18px_-10px_rgba(26,123,155,.75)] disabled:opacity-80"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> {sendProgress}%
                </>
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 px-4 pb-8 pt-4">
          <button
            type="button"
            onClick={handleShutter}
            disabled={!stream}
            aria-label={mode === "photo" ? "Take photo" : recording ? "Stop recording" : "Start recording"}
            className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-white transition-transform duration-150 active:scale-90 disabled:opacity-40"
          >
            <span
              className={`block transition-all duration-200 ${
                mode === "photo"
                  ? "h-14 w-14 rounded-full bg-white"
                  : recording
                    ? "h-7 w-7 rounded-md bg-error-500"
                    : "h-14 w-14 rounded-full bg-error-500"
              }`}
            />
          </button>

          {!recording && (
            <div className="flex rounded-full bg-white/10 p-1 text-sm font-medium">
              {(["photo", "video"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 transition-colors ${mode === m ? "bg-white text-black" : "text-white/80 hover:text-white"}`}
                >
                  {m === "photo" ? <Camera className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                  {m === "photo" ? "Photo" : "Video"}
                </button>
              ))}
            </div>
          )}

          <p className="text-[11px] text-white/50">
            {mode === "video" ? `Up to ${MAX_VIDEO_SECONDS}s${uploadLimits ? ` / ${maxFileSizeLabel(uploadLimits)}` : ""}` : "Tap to take a photo"}
          </p>
        </div>
      )}
    </div>,
    document.body
  );
}
