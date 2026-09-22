import { getSavedToken } from '@/utils/authToken';
import api from './client';
import { ChatParticipant } from '@/types/chat/chat.models';

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
