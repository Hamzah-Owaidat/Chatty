import axios from 'axios';
import { getSavedToken } from '@/utils/authToken';
import api from './client';
import { ApiEnvelope } from '@/types/chat/chat.models';
import { LastSeenPrivacy, LastSeenVisibility, NotificationPreferences, User } from '@/types/user';

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

// PATCH /api/user/me/email — { newEmail, password }. Returns the user with pendingEmail
// set; `email` itself only changes once the link mailed to the new address is clicked.
export async function changeEmail(newEmail: string, password: string): Promise<User> {
  try {
    const response = await api.patch<ApiEnvelope<User>>(
      '/user/me/email',
      { newEmail, password },
      { headers: authHeaders() }
    );
    return response.data.data;
  } catch (err) {
    rethrowApiError(err);
  }
}

// PATCH /api/user/me/notifications — partial; omitted flags are left unchanged.
export async function updateNotificationPreferences(
  changes: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  try {
    const response = await api.patch<ApiEnvelope<NotificationPreferences>>('/user/me/notifications', changes, {
      headers: authHeaders(),
    });
    return response.data.data;
  } catch (err) {
    rethrowApiError(err);
  }
}

// GET /api/user/me/privacy/lastseen — the setting plus the hand-picked contacts list.
export async function getLastSeenPrivacy(): Promise<LastSeenPrivacy> {
  try {
    const response = await api.get<ApiEnvelope<LastSeenPrivacy>>('/user/me/privacy/lastseen', {
      headers: authHeaders(),
    });
    return response.data.data;
  } catch (err) {
    rethrowApiError(err);
  }
}

// PATCH /api/user/me/privacy/lastseen — { value }.
export async function updateLastSeenVisibility(value: LastSeenVisibility): Promise<LastSeenPrivacy> {
  try {
    const response = await api.patch<ApiEnvelope<LastSeenPrivacy>>(
      '/user/me/privacy/lastseen',
      { value },
      { headers: authHeaders() }
    );
    return response.data.data;
  } catch (err) {
    rethrowApiError(err);
  }
}

// POST /api/user/me/privacy/lastseen/contacts/{userId} — adding someone already listed is a no-op.
export async function addLastSeenContact(userId: string): Promise<LastSeenPrivacy> {
  try {
    const response = await api.post<ApiEnvelope<LastSeenPrivacy>>(
      `/user/me/privacy/lastseen/contacts/${userId}`,
      null,
      { headers: authHeaders() }
    );
    return response.data.data;
  } catch (err) {
    rethrowApiError(err);
  }
}

// DELETE /api/user/me/privacy/lastseen/contacts/{userId}
export async function removeLastSeenContact(userId: string): Promise<LastSeenPrivacy> {
  try {
    const response = await api.delete<ApiEnvelope<LastSeenPrivacy>>(`/user/me/privacy/lastseen/contacts/${userId}`, {
      headers: authHeaders(),
    });
    return response.data.data;
  } catch (err) {
    rethrowApiError(err);
  }
}
