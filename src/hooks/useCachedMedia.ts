"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useAppSelector } from "@/store/hooks";
import { downloadFileContent } from "@/lib/api/file";
import { getCachedMedia, mediaKey, putCachedMedia } from "@/lib/media/mediaCache";
import { getErrorMessage } from "@/utils/error";
import { showToast } from "@/utils/toast";

// checking: looking in the local cache · idle: not downloaded yet (user must choose to)
// downloading: in progress · ready: objectUrl is set · error: download failed (can retry)
export type CachedMediaStatus = "checking" | "idle" | "downloading" | "ready" | "error";

/**
 * A chat media file that only loads when the user asks for it: shows from the local
 * IndexedDB cache if it was downloaded (or sent) before, otherwise waits for download().
 */
export function useCachedMedia(fileId: string, sizeBytes?: number) {
  const userId = useAppSelector((state) => state.auth.user?.id);
  const [status, setStatus] = useState<CachedMediaStatus>("checking");
  const [progress, setProgress] = useState(0);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const showBlob = useCallback((blob: Blob) => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = URL.createObjectURL(blob);
    setObjectUrl(objectUrlRef.current);
    setStatus("ready");
  }, []);

  useEffect(() => {
    if (!userId || !fileId) return;
    let cancelled = false;

    setStatus("checking");
    getCachedMedia(mediaKey(userId, fileId))
      .then((blob) => {
        if (cancelled) return;
        if (blob) showBlob(blob);
        else setStatus("idle");
      })
      .catch(() => !cancelled && setStatus("idle"));

    return () => {
      cancelled = true;
    };
  }, [userId, fileId, showBlob]);

  // Release the in-memory copy and any in-flight download when the bubble unmounts.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const download = useCallback(async () => {
    if (!userId) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setProgress(0);
    setStatus("downloading");

    try {
      const blob = await downloadFileContent(fileId, {
        onProgress: setProgress,
        expectedSize: sizeBytes,
        signal: controller.signal,
      });
      await putCachedMedia(mediaKey(userId, fileId), blob);
      showBlob(blob);
    } catch (err) {
      if (axios.isCancel(err)) {
        setStatus("idle");
        return;
      }
      setStatus("error");
      showToast.error(getErrorMessage(err));
    } finally {
      abortRef.current = null;
    }
  }, [userId, fileId, sizeBytes, showBlob]);

  const cancel = useCallback(() => abortRef.current?.abort(), []);

  return { status, progress, objectUrl, download, cancel };
}
