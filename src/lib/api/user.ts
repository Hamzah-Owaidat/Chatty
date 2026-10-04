import axios from 'axios';
import { getSavedToken } from '@/utils/authToken';
import api from './client';
import { ApiEnvelope, ChatParticipant } from '@/types/chat/chat.models';
import { User } from '@/types/user';
import { toPercent } from './file';

export async function searchUsers(query: string): Promise<ChatParticipant[]> {
  const token = getSavedToken();
  if (!token) throw new Error('No auth token found');

  try {
    const response = await api.get('/user', {
      params: { query },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = response.data;

    if (data?.isSuccess && Array.isArray(data.data)) {
      return data.data;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    if (Array.isArray(data)) {
      return data;
    }

    return [];
  } catch (err: any) {
    if (err.response?.data) {
      throw err.response.data;
    }
    throw err;
  }
}

// POST /api/user/me/image — multipart, field "file". Returns the updated user (new image URL).
export async function uploadProfileImage(file: File, onProgress?: (percent: number) => void): Promise<User> {
  const token = getSavedToken();
  if (!token) throw new Error('No auth token found');

  const form = new FormData();
  form.append('file', file);

  try {
    const response = await api.post<ApiEnvelope<User>>('/user/me/image', form, {
      headers: { Authorization: `Bearer ${token}` },
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
