import { getSavedToken } from '@/utils/authToken';
import api from './client';
import { ChatRequestDto } from '@/types/chat/chat.models';

function authHeaders() {
  const token = getSavedToken();
  if (!token) throw new Error('No auth token found');
  return { Authorization: `Bearer ${token}` };
}

export async function sendChatRequest(receiverUserId: string): Promise<void> {
  try {
    await api.post('/chat-requests', { receiverUserId }, { headers: authHeaders() });
  } catch (err: any) {
    if (err.response?.data) {
      throw err.response.data;
    }
    throw err;
  }
}

async function getRequests(direction: 'incoming' | 'outgoing'): Promise<ChatRequestDto[]> {
  try {
    const response = await api.get(`/chat-requests/${direction}`, { headers: authHeaders() });
    const data = response.data;
    return Array.isArray(data?.data) ? data.data : [];
  } catch (err: any) {
    if (err.response?.data) {
      throw err.response.data;
    }
    throw err;
  }
}

export const getIncomingRequests = () => getRequests('incoming');
export const getOutgoingRequests = () => getRequests('outgoing');

export async function acceptChatRequest(id: string): Promise<void> {
  try {
    await api.post(`/chat-requests/${id}/accept`, null, { headers: authHeaders() });
  } catch (err: any) {
    if (err.response?.data) {
      throw err.response.data;
    }
    throw err;
  }
}

export async function rejectChatRequest(id: string): Promise<void> {
  try {
    await api.post(`/chat-requests/${id}/reject`, null, { headers: authHeaders() });
  } catch (err: any) {
    if (err.response?.data) {
      throw err.response.data;
    }
    throw err;
  }
}

export async function cancelChatRequest(id: string): Promise<void> {
  try {
    await api.delete(`/chat-requests/${id}`, { headers: authHeaders() });
  } catch (err: any) {
    if (err.response?.data) {
      throw err.response.data;
    }
    throw err;
  }
}
