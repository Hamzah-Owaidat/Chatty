// Mirrors the backend's FileKind enum (numeric — no JsonStringEnumConverter registered).
export enum FileKind {
  Image = 1,
  Video = 2,
  Audio = 3,
  Document = 4,
}

export enum FileStatus {
  Pending = 1,
  Attached = 2,
  // Abandoned upload queued for deletion by the server's cleanup job.
  Expired = 3,
}

// POST /api/chat/{chatId}/files response item — an upload not yet sent in a message.
export interface FileAttachmentDto {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  kind: FileKind;
  status: FileStatus;
  isPrivate: boolean;
  // Tiny blurred JPEG (base64) for photos/videos — shown until the file is downloaded.
  preview?: string | null;
  createdAt: string;
}

// A file embedded in a sent message (backend's MessageAttachment). Chat files are private:
// no storage URL is ever sent — the content is downloaded by fileId through the API
// (access-checked on every request) and then kept in the local media cache.
export interface MessageAttachment {
  fileId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  kind: FileKind;
  isPrivate: boolean;
  // Tiny blurred JPEG (base64) for photos/videos — shown until the file is downloaded.
  preview?: string | null;
}

// GET /api/files/limits — the server's upload limits, the single source of truth.
export interface FileUploadLimits {
  maxFileSizeBytes: number;
  maxFilesPerUpload: number;
  allowedContentTypes: string[];
}
