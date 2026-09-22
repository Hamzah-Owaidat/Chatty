import { getSavedToken } from '@/utils/authToken';
import api from './client';
import { UserChat, ApiChatResponse, ChatCreateDto, ChatSummary } from '@/types/chat/chat.models';

export async function getUserChats(): Promise<UserChat[]> {
  const token = getSavedToken();
  if (!token) throw new Error('No auth token found');

  try {
    const response = await api.get<ApiChatResponse>(
      '/chat/user-chats',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    // The API returns { isSuccess, statusCode, error, data: [...] }
    const apiResponse = response.data;
    
    // Extract the data array from the response
    if (apiResponse && apiResponse.data && Array.isArray(apiResponse.data)) {
      return apiResponse.data;
    }
    
    // Fallback: if response.data is directly an array (some APIs might return differently)
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    console.warn('Unexpected API response structure:', apiResponse);
    return [];
  } catch (err: any) {
    // For failed requests that return error responses (400, 401, etc.)
    if (err.response?.data) {
      throw err.response.data;
    }
    // For network errors or other issues
    throw err;
  }
}

// POST /api/chat — group chats only. Response is the raw Chat object, not the
// { isSuccess, data } envelope (and on failure the body is a plain error string).
export async function createChat(payload: ChatCreateDto): Promise<ChatSummary> {
  const token = getSavedToken();
  if (!token) throw new Error('No auth token found');

  try {
    const response = await api.post(
      '/chat',
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (err: any) {
    if (err.response?.data) {
      throw err.response.data;
    }
    throw err;
  }
}
