import axios from 'axios';
import { getSavedToken } from '@/utils/authToken';
import api from './client';
import { ApiEnvelope } from '@/types/chat/chat.models';
import { FileAttachmentDto, FileUploadLimits } from '@/types/file.models';

const authHeaders = () => {
  const token = getSavedToken();
  if (!token) throw new Error('No auth token found');
  return { Authorization: `Bearer ${token}` };
};

// Turns an axios upload progress event into 0–100 (total can be missing on some browsers).
export const toPercent = (loaded: number, total?: number) =>
  total ? Math.min(100, Math.round((loaded / total) * 100)) : 0;

// POST /api/chat/{chatId}/files — multipart upload. The files come back as Pending
// attachments; send their ids with the message (SignalR SendMessage) to attach them.
// previews[i] is an optional tiny blurred JPEG (base64) for files[i].
export async function uploadChatFiles(
  chatId: string,
  files: File[],
  onProgress?: (percent: number) => void,
  previews: (string | undefined)[] = []
): Promise<FileAttachmentDto[]> {
  const form = new FormData();
  files.forEach((file, i) => {
    form.append('files', file);
    // One entry per file, in the same order — empty when there's no preview.
    form.append('previews', previews[i] ?? '');
  });

  try {
    // No explicit Content-Type: the browser sets multipart/form-data with its boundary.
    const response = await api.post<ApiEnvelope<FileAttachmentDto[]>>(`/chat/${chatId}/files`, form, {
      headers: authHeaders(),
      onUploadProgress: (e) => onProgress?.(toPercent(e.loaded, e.total)),
    });

    return response.data.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      throw err.response.data;
    }
    throw err;
  }
}

// GET /api/files/limits — what the server accepts (max size, files per upload, types).
export async function getUploadLimits(): Promise<FileUploadLimits> {
  try {
    const response = await api.get<ApiEnvelope<FileUploadLimits>>('/files/limits', { headers: authHeaders() });
    return response.data.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      throw err.response.data;
    }
    throw err;
  }
}

// GET /api/files/{fileId}/content — the file's bytes, streamed through the API. Used to
// download chat media once into the local media cache (see lib/media/mediaCache).
export async function downloadFileContent(
  fileId: string,
  options: { onProgress?: (percent: number) => void; expectedSize?: number; signal?: AbortSignal } = {}
): Promise<Blob> {
  try {
    const response = await api.get<Blob>(`/files/${fileId}/content`, {
      headers: authHeaders(),
      responseType: 'blob',
      signal: options.signal,
      // Fall back to the known size if the response has no Content-Length.
      onDownloadProgress: (e) => options.onProgress?.(toPercent(e.loaded, e.total ?? options.expectedSize)),
    });

    return response.data;
  } catch (err) {
    // With responseType 'blob' the API's JSON error envelope arrives as a Blob too.
    if (axios.isAxiosError(err) && err.response?.data instanceof Blob) {
      try {
        throw JSON.parse(await err.response.data.text());
      } catch (parsed) {
        if (parsed && typeof parsed === 'object' && 'error' in parsed) throw parsed;
      }
    }
    throw err;
  }
}

// DELETE /api/files/{fileId} — only for your own uploads that haven't been sent yet.
export async function deleteFile(fileId: string): Promise<void> {
  try {
    await api.delete(`/files/${fileId}`, { headers: authHeaders() });
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      throw err.response.data;
    }
    throw err;
  }
}
