import axios from 'axios';
import { getSavedToken } from '@/utils/authToken';
import api from './client';
import { ApiEnvelope } from '@/types/chat/chat.models';

// Account settings endpoints (CHT-21). Same envelope/error convention as lib/api/user.ts:
// resolves with `data` on success, throws the backend's { isSuccess, error } body otherwise.

function authHeaders() {
  const token = getSavedToken();
  if (!token) throw new Error('No auth token found');
  return { Authorization: `Bearer ${token}` };
}

function rethrowApiError(err: unknown): never {
  if (axios.isAxiosError(err) && err.response?.data) {
    throw err.response.data;
  }
  throw err;
}

// PATCH /api/user/me/password — { currentPassword, newPassword }. Resolves with the
// success message. 400 on a wrong current password, 429 after too many attempts.
export async function changePassword(currentPassword: string, newPassword: string): Promise<string> {
  try {
    const response = await api.patch<ApiEnvelope<null> & { message?: string }>(
      '/user/me/password',
      { currentPassword, newPassword },
      { headers: authHeaders() }
    );
    return response.data.message ?? 'Your password has been changed.';
  } catch (err) {
    rethrowApiError(err);
  }
}
