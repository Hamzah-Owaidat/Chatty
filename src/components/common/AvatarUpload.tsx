"use client";
import React, { useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { acceptAttribute, validateFile } from "@/utils/file";
import { useUploadLimits } from "@/hooks/useUploadLimits";
import { FileKind } from "@/types/file.models";
import { showToast } from "@/utils/toast";

interface AvatarUploadProps {
  imageUrl?: string | null;
  // Shown (first letter) when there's no image yet.
  fallbackText: string;
  // Uploads the picked file; throw to signal failure (the toast is shown by the caller).
  onUpload: (file: File, onProgress: (percent: number) => void) => Promise<void>;
  size?: number;
  disabled?: boolean;
}

/**
 * A round avatar with a camera button that picks, validates and uploads a new image,
 * showing a local preview and progress while the upload runs.
 */
export default function AvatarUpload({ imageUrl, fallbackText, onUpload, size = 112, disabled = false }: AvatarUploadProps) {
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
      await onUpload(file, setProgress);
    } finally {
      setProgress(null);
      setPreviewUrl(null);
    }
  };

  const uploading = progress !== null;
  const shownImage = previewUrl || imageUrl;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#1f88aa] via-[#1a7b9b] to-[#17708d] text-3xl font-semibold text-white shadow-[0_14px_30px_-18px_rgba(26,123,155,.8)]">
        {shownImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote CDN or local object URL
          <img src={shownImage} alt={fallbackText} className="h-full w-full object-cover" />
        ) : (
          fallbackText.charAt(0).toUpperCase() || "?"
        )}
      </div>

      {uploading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/50 text-white">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="mt-1 text-xs font-medium">{progress}%</span>
        </div>
      )}

      {!disabled && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          aria-label="Change picture"
          className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#1a7b9b] text-white shadow-md transition-transform duration-200 hover:scale-110 disabled:opacity-60 dark:border-stone-900 dark:bg-[#2596bb]"
        >
          <Camera className="h-4 w-4" />
        </button>
      )}

      <input ref={inputRef} type="file" accept={acceptAttribute(uploadLimits, [FileKind.Image]) ?? "image/*"} onChange={handleChange} className="hidden" />
    </div>
  );
}
