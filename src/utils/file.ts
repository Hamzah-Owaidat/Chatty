import { FileKind, FileUploadLimits, MessageAttachment } from '@/types/file.models';

// Upload limits (size, count, allowed types) come from the server — GET /api/files/limits,
// via useUploadLimits — so the backend's "FileUpload" settings are the only place to
// change them. While they're loading (null), only obviously-bad files are rejected here;
// the server enforces everything regardless.

export function getFileKind(contentType: string): FileKind {
  if (contentType.startsWith('image/')) return FileKind.Image;
  if (contentType.startsWith('video/')) return FileKind.Video;
  if (contentType.startsWith('audio/')) return FileKind.Audio;
  return FileKind.Document;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const maxFileSizeLabel = (limits: FileUploadLimits | null) =>
  limits ? formatFileSize(limits.maxFileSizeBytes).replace('.0 ', ' ') : null;

// The allowed types, narrowed to a group of kinds (e.g. just images for avatars).
export function allowedTypes(limits: FileUploadLimits | null, kinds?: FileKind[]): string[] | null {
  if (!limits) return null;
  return kinds ? limits.allowedContentTypes.filter((t) => kinds.includes(getFileKind(t))) : limits.allowedContentTypes;
}

// Value for <input accept="...">; undefined (anything) until the limits have loaded.
export const acceptAttribute = (limits: FileUploadLimits | null, kinds?: FileKind[]) =>
  allowedTypes(limits, kinds)?.join(',') || undefined;

/**
 * Returns why a file can't be uploaded, or null if it's fine. kinds narrows the accepted
 * types (e.g. images only for a profile picture).
 */
export function validateFile(file: File, limits: FileUploadLimits | null, kinds?: FileKind[]): string | null {
  if (file.size === 0) return `"${file.name}" is empty.`;

  if (kinds && !kinds.includes(getFileKind(file.type))) {
    return `"${file.name}" is a file type that isn't supported here.`;
  }

  if (!limits) return null;

  if (file.size > limits.maxFileSizeBytes) {
    return `"${file.name}" is larger than ${maxFileSizeLabel(limits)}.`;
  }

  // Compare the bare MIME type ("video/webm;codecs=vp9" → "video/webm"), like the server.
  const type = file.type.split(';')[0].trim().toLowerCase();
  if (!allowedTypes(limits, kinds)!.includes(type)) {
    return `"${file.name}" is a file type that isn't supported.`;
  }

  return null;
}

// Sidebar/notification preview text for a message that may only carry attachments.
export function describeAttachments(attachments?: MessageAttachment[] | null): string {
  if (!attachments || attachments.length === 0) return '';
  if (attachments.length > 1) return `📎 ${attachments.length} attachments`;

  const [file] = attachments;
  switch (file.kind) {
    case FileKind.Image:
      return '📷 Photo';
    case FileKind.Video:
      return '🎥 Video';
    case FileKind.Audio:
      return '🎵 Audio';
    default:
      return `📄 ${file.fileName}`;
  }
}
