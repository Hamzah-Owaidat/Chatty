"use client";
import React, { useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { acceptAttribute, validateFile } from "@/utils/file";
import { convertToWebP, ImageConversionError } from "@/utils/image";
import { useUploadLimits } from "@/hooks/useUploadLimits";
import { FileKind } from "@/types/file.models";
import { showToast } from "@/utils/toast";

interface BackgroundImageUploadProps {
  imageUrl?: string | null;
  // Uploads the picked file; throw to signal failure (the toast is shown by the caller).
  onUpload: (file: File, onProgress: (percent: number) => void) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

/**
 * A wide banner with a camera button that picks, validates and uploads a new background
 * image, showing a local preview and progress while the upload runs. Falls back to the
 * brand gradient when there's no image set, same spot the profile page's static cover
 * banner used to occupy.
 */
export default function BackgroundImageUpload({ imageUrl, onUpload, disabled = false, className = "" }: BackgroundImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const uploadLimits = useUploadLimits();

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so picking the same file again still fires onChange.
    e.target.value = "";
    if (!file) return;

    const error = validateFile(file, uploadLimits, [FileKind.Image]);
    if (error) {
      showToast.error(error);
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setProgress(0);

    try {
      const optimized = await convertToWebP(file);
      await onUpload(optimized, setProgress);
    } catch (err) {
      if (err instanceof ImageConversionError) showToast.error(err.message);
      else throw err;
    } finally {
      setProgress(null);
      setPreviewUrl(null);
    }
  };

  const uploading = progress !== null;
  const shownImage = previewUrl || imageUrl;

  return (
    <div className={`relative h-28 w-full overflow-hidden ${className}`}>
      {shownImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote CDN or local object URL
        <img src={shownImage} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-[#1f88aa] via-[#1a7b9b] to-[#17708d]" />
      )}

      {uploading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="mt-1 text-xs font-medium">{progress}%</span>
        </div>
      )}

      {!disabled && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          aria-label="Change background image"
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#1a7b9b] text-white shadow-md transition-transform duration-200 hover:scale-110 disabled:opacity-60 dark:border-stone-900 dark:bg-[#2596bb]"
        >
          <Camera className="h-4 w-4" />
        </button>
      )}

      <input ref={inputRef} type="file" accept={acceptAttribute(uploadLimits, [FileKind.Image]) ?? "image/*"} onChange={handleChange} className="hidden" />
    </div>
  );
}
