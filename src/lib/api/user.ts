import axios from 'axios';
import { getSavedToken } from '@/utils/authToken';
import api from './client';
import { ApiEnvelope, ChatParticipant } from '@/types/chat/chat.models';
import { User, UserProfile } from '@/types/user';
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

// PATCH /api/user/me/displayname — { displayName }. Returns the updated user, including
// the refreshed displayNameUpdatedAt. 400s server-side if still within the 30-day cooldown.
export async function updateDisplayName(displayName: string): Promise<User> {
  const token = getSavedToken();
  if (!token) throw new Error('No auth token found');

  try {
    const response = await api.patch<ApiEnvelope<User>>(
      '/user/me/displayname',
      { displayName },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      throw err.response.data;
    }
    throw err;
  }
}

// PATCH /api/user/me/bio — { bio }. Returns the updated user.
export async function updateBio(bio: string): Promise<User> {
  const token = getSavedToken();
  if (!token) throw new Error('No auth token found');

  try {
    const response = await api.patch<ApiEnvelope<User>>(
      '/user/me/bio',
      { bio },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      throw err.response.data;
    }
    throw err;
  }
}

// POST /api/user/me/backgroundimage — multipart, field "file". Returns the updated user
// (new backgroundImage URL).
export async function uploadBackgroundImage(file: File, onProgress?: (percent: number) => void): Promise<User> {
  const token = getSavedToken();
  if (!token) throw new Error('No auth token found');

  const form = new FormData();
  form.append('file', file);

  try {
    const response = await api.post<ApiEnvelope<User>>('/user/me/backgroundimage', form, {
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

// GET /api/user/{id} — another user's read-only profile (Contact Info modal, hover-card).
export async function getUserProfile(id: string): Promise<UserProfile> {
  const token = getSavedToken();
  if (!token) throw new Error('No auth token found');

  try {
    const response = await api.get<ApiEnvelope<UserProfile>>(`/user/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      throw err.response.data;
    }
    throw err;
  }
}
