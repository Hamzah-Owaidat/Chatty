"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDown, Download, FileText, Image as ImageIcon, Music, RotateCcw, Video, X } from "lucide-react";
import { FileKind, MessageAttachment } from "@/types/file.models";
import { CachedMediaStatus, useCachedMedia } from "@/hooks/useCachedMedia";
import { formatFileSize } from "@/utils/file";

interface MessageAttachmentsProps {
  attachments: MessageAttachment[];
  isOwn: boolean;
}

/**
 * Renders a message's files inside its bubble. Nothing is loaded automatically — like
 * WhatsApp, the user taps to download, the file comes through the API (which re-checks
 * chat membership), is kept in the browser's local media cache, and from then on it's
 * shown from there.
 */
export default function MessageAttachments({ attachments, isOwn }: MessageAttachmentsProps) {
  const media = attachments.filter((a) => a.kind === FileKind.Image || a.kind === FileKind.Video);
  const audio = attachments.filter((a) => a.kind === FileKind.Audio);
  const documents = attachments.filter((a) => a.kind === FileKind.Document);

  return (
    <div className="flex flex-col gap-1.5">
      {media.length > 0 && (
        <div className={`grid gap-1 ${media.length === 1 ? "w-60 grid-cols-1" : "w-60 grid-cols-2"}`}>
          {media.map((file) => (
            <MediaTile key={file.fileId} file={file} compact={media.length > 1} />
          ))}
        </div>
      )}

      {audio.map((file) => (
        <AudioAttachment key={file.fileId} file={file} isOwn={isOwn} />
      ))}

      {documents.map((file) => (
        <DocumentCard key={file.fileId} file={file} isOwn={isOwn} />
      ))}
    </div>
  );
}

function MediaTile({ file, compact }: { file: MessageAttachment; compact: boolean }) {
  const { status, progress, objectUrl, download, cancel } = useCachedMedia(file.fileId, file.sizeBytes);
  const [viewerOpen, setViewerOpen] = useState(false);
  const isVideo = file.kind === FileKind.Video;
  const box = `relative overflow-hidden rounded-xl ${compact ? "aspect-square" : "h-44"}`;

  if (status === "ready" && objectUrl) {
    return (
      <div className={`group/media ${box} bg-black`}>
        {isVideo ? (
          <video src={objectUrl} controls preload="metadata" className="h-full w-full object-contain" />
        ) : (
          <button type="button" onClick={() => setViewerOpen(true)} className="block h-full w-full">
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob: URL */}
            <img src={objectUrl} alt={file.fileName} className="h-full w-full object-cover" />
          </button>
        )}
        <SaveButton href={objectUrl} fileName={file.fileName} className="absolute right-1.5 top-1.5 opacity-0 group-hover/media:opacity-100" />
        {viewerOpen && <MediaViewer file={file} url={objectUrl} onClose={() => setViewerOpen(false)} />}
      </div>
    );
  }

  // The sender's tiny blurred preview, embedded in the message — costs no request.
  const blurredPreview = file.preview && (
    // eslint-disable-next-line @next/next/no-img-element -- inline data: URL, a few hundred bytes
    <img
      src={`data:image/jpeg;base64,${file.preview}`}
      alt=""
      aria-hidden
      className="absolute inset-0 h-full w-full scale-110 object-cover blur-md"
    />
  );

  if (status === "checking") {
    return (
      <div className={`${box} bg-gray-200 dark:bg-stone-700 ${blurredPreview ? "" : "animate-pulse"}`}>{blurredPreview}</div>
    );
  }

  // Not downloaded yet: the blurred preview (or a plain backdrop), the type, size and a download button.
  const KindIcon = isVideo ? Video : ImageIcon;

  return (
    <div className={`${box} flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-gray-300 to-gray-400 text-white dark:from-stone-700 dark:to-stone-800`}>
      {blurredPreview}
      {/* Keeps the controls readable over a bright preview */}
      {blurredPreview && <span className="absolute inset-0 bg-black/15" />}
      <KindIcon className="absolute left-2 top-2 h-4 w-4 opacity-90 drop-shadow" />
      <span className="relative">
        <DownloadControl status={status} progress={progress} onDownload={download} onCancel={cancel} />
      </span>
      <span className="relative rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-medium">{formatFileSize(file.sizeBytes)}</span>
    </div>
  );
}

function AudioAttachment({ file, isOwn }: { file: MessageAttachment; isOwn: boolean }) {
  const { status, progress, objectUrl, download, cancel } = useCachedMedia(file.fileId, file.sizeBytes);

  if (status === "ready" && objectUrl) {
    return <audio src={objectUrl} controls preload="metadata" className="w-64 max-w-full" />;
  }

  return (
    <div className={`flex w-64 max-w-full items-center gap-3 rounded-xl p-2 ${isOwn ? "bg-white/15" : "bg-gray-100 dark:bg-white/5"}`}>
      {status === "checking" ? (
        <span className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
      ) : (
        <DownloadControl status={status} progress={progress} onDownload={download} onCancel={cancel} size={44} dark={!isOwn} />
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 truncate text-sm font-medium">
          <Music className="h-3.5 w-3.5 shrink-0" /> {file.fileName}
        </span>
        <span className={`block text-[11px] ${isOwn ? "text-white/75" : "text-gray-500 dark:text-stone-400"}`}>
          {formatFileSize(file.sizeBytes)}
        </span>
      </span>
    </div>
  );
}

// Round download button; while downloading it becomes a progress ring you can tap to cancel.
function DownloadControl({
  status,
  progress,
  onDownload,
  onCancel,
  size = 48,
  dark = false,
}: {
  status: CachedMediaStatus;
  progress: number;
  onDownload: () => void;
  onCancel: () => void;
  size?: number;
  dark?: boolean;
}) {
  const radius = size / 2 - 3;
  const circumference = 2 * Math.PI * radius;
  const surface = dark ? "bg-[#1a7b9b] text-white" : "bg-black/45 text-white backdrop-blur-sm";

  if (status === "downloading") {
    return (
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancel download"
        className={`relative flex shrink-0 items-center justify-center rounded-full ${surface}`}
        style={{ width: size, height: size }}
      >
        <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeOpacity={0.25} strokeWidth={3} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress / 100)}
            className="transition-[stroke-dashoffset] duration-200"
          />
        </svg>
        <X className="h-4 w-4" />
      </button>
    );
  }

  const Icon = status === "error" ? RotateCcw : ArrowDown;

  return (
    <button
      type="button"
      onClick={onDownload}
      aria-label={status === "error" ? "Retry download" : "Download"}
      className={`flex shrink-0 items-center justify-center rounded-full transition-transform duration-200 hover:scale-105 ${surface}`}
      style={{ width: size, height: size }}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

// Saves the locally cached copy to the user's device (no new network request).
function SaveButton({ href, fileName, className = "" }: { href: string; fileName: string; className?: string }) {
  return (
    <a
      href={href}
      download={fileName}
      aria-label={`Save ${fileName}`}
      onClick={(e) => e.stopPropagation()}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white transition-opacity duration-150 hover:bg-black/70 ${className}`}
    >
      <Download className="h-4 w-4" />
    </a>
  );
}

// Full-screen photo viewer. Portalled to <body>: the bubble's CSS transforms would
// otherwise trap a position:fixed overlay inside it.
function MediaViewer({ file, url, onClose }: { file: MessageAttachment; url: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex flex-col bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white" onClick={(e) => e.stopPropagation()}>
        <span className="truncate text-sm font-medium">{file.fileName}</span>
        <span className="flex shrink-0 items-center gap-2">
          <SaveButton href={url} fileName={file.fileName} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </span>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- local blob: URL */}
        <img src={url} alt={file.fileName} onClick={(e) => e.stopPropagation()} className="max-h-full max-w-full object-contain" />
      </div>
    </div>,
    document.body
  );
}

function DocumentCard({ file, isOwn }: { file: MessageAttachment; isOwn: boolean }) {
  const { status, progress, objectUrl, download, cancel } = useCachedMedia(file.fileId, file.sizeBytes);
  const ready = status === "ready" && !!objectUrl;

  // Downloaded: open the local copy (PDFs/text render in the browser's own viewer).
  const handleOpen = () => {
    if (ready) window.open(objectUrl!, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      role={ready ? "button" : undefined}
      tabIndex={ready ? 0 : undefined}
      onClick={handleOpen}
      onKeyDown={(e) => ready && (e.key === "Enter" || e.key === " ") && handleOpen()}
      className={`flex w-64 max-w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors duration-150 ${
        isOwn ? "bg-white/15" : "bg-gray-100 dark:bg-white/5"
      } ${ready ? (isOwn ? "cursor-pointer hover:bg-white/25" : "cursor-pointer hover:bg-gray-200 dark:hover:bg-white/10") : ""}`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          isOwn ? "bg-white/20 text-white" : "bg-theme-purple-500/10 text-theme-purple-500"
        }`}
      >
        <FileText className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{file.fileName}</span>
        <span className={`block text-[11px] ${isOwn ? "text-white/75" : "text-gray-500 dark:text-stone-400"}`}>
          {formatFileSize(file.sizeBytes)}
          {status === "downloading" && ` · ${progress}%`}
        </span>
      </span>
      {ready ? (
        <SaveButton href={objectUrl!} fileName={file.fileName} />
      ) : status === "checking" ? (
        <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
      ) : (
        <span onClick={(e) => e.stopPropagation()}>
          <DownloadControl status={status} progress={progress} onDownload={download} onCancel={cancel} size={36} dark={!isOwn} />
        </span>
      )}
    </div>
  );
}
