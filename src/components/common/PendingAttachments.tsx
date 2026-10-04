"use client";
import React from "react";
import { FileText, Music, X } from "lucide-react";
import { FileKind } from "@/types/file.models";
import { formatFileSize } from "@/utils/file";

// A file picked in the composer but not uploaded yet.
export interface PendingFile {
  id: string;
  file: File;
  kind: FileKind;
  // Object URL for images/videos — revoke it when the file is removed/sent.
  previewUrl?: string;
}

interface PendingAttachmentsProps {
  files: PendingFile[];
  onRemove: (id: string) => void;
  // 0–100 while uploading, null otherwise.
  uploadProgress: number | null;
}

/**
 * The tray above the message input listing picked files, with a remove button each
 * and an upload progress bar while sending.
 */
export default function PendingAttachments({ files, onRemove, uploadProgress }: PendingAttachmentsProps) {
  if (files.length === 0) return null;

  const uploading = uploadProgress !== null;

  return (
    <div className="mb-2 rounded-2xl border border-gray-200/70 bg-white/90 p-2 dark:border-stone-700/70 dark:bg-stone-900/80">
      <div className="chat-scrollbar flex gap-2 overflow-x-auto pb-1">
        {files.map((pending) => (
          <div
            key={pending.id}
            className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-white/5"
            title={`${pending.file.name} (${formatFileSize(pending.file.size)})`}
          >
            {pending.kind === FileKind.Image && pending.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
              <img src={pending.previewUrl} alt={pending.file.name} className="h-full w-full object-cover" />
            ) : pending.kind === FileKind.Video && pending.previewUrl ? (
              <video src={pending.previewUrl} muted className="h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1 px-1 text-center">
                {pending.kind === FileKind.Audio ? (
                  <Music className="h-6 w-6 text-[#1a7b9b] dark:text-[#60c7e3]" />
                ) : (
                  <FileText className="h-6 w-6 text-theme-purple-500" />
                )}
                <span className="w-full truncate text-[10px] text-gray-600 dark:text-stone-300">{pending.file.name}</span>
              </div>
            )}

            {!uploading && (
              <button
                type="button"
                onClick={() => onRemove(pending.id)}
                aria-label={`Remove ${pending.file.name}`}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-90 transition-opacity hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {uploading && (
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-stone-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#1f88aa] to-[#17708d] transition-[width] duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span className="w-10 text-right text-[11px] text-gray-500 dark:text-stone-400">{uploadProgress}%</span>
        </div>
      )}
    </div>
  );
}
