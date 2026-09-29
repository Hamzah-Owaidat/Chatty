import { getSavedToken } from '@/utils/authToken';
import api from './client';
import { AcceptedInviteChat, ChatInviteInfo } from '@/types/chat/chat.models';

function authHeaders() {
  const token = getSavedToken();
  if (!token) throw new Error('No auth token found');
  return { Authorization: `Bearer ${token}` };
}

// Returns the caller's own invite link, creating one the first time it's requested.
export async function getOrCreateInviteLink(): Promise<ChatInviteInfo> {
  try {
    const response = await api.post('/chat-invites', null, { headers: authHeaders() });
    return response.data.data;
  } catch (err: any) {
    if (err.response?.data) {
      throw err.response.data;
    }
    throw err;
  }
}

// Public preview info for a token — no auth required, safe for an unauthenticated visitor.
export async function getInviteInfo(token: string): Promise<ChatInviteInfo> {
  try {
    const response = await api.get(`/chat-invites/${encodeURIComponent(token)}`);
    return response.data.data;
  } catch (err: any) {
    if (err.response?.data) {
      throw err.response.data;
    }
    throw err;
  }
}

export async function acceptInvite(token: string): Promise<AcceptedInviteChat> {
  try {
    const response = await api.post(`/chat-invites/${encodeURIComponent(token)}/accept`, null, { headers: authHeaders() });
    return response.data.data;
  } catch (err: any) {
    if (err.response?.data) {
      throw err.response.data;
    }
    throw err;
  }
}
