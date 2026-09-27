import { getSavedToken } from '@/utils/authToken';
import api from './client';
import { UserChat, ApiChatResponse, ChatCreateDto, ChatSummary, UpdateChatDetailsDto, ApiEnvelope } from '@/types/chat/chat.models';

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

// POST /api/chat — group chats only; only the caller becomes an immediate member,
// everyone else listed gets sent a chat request. Response is the { isSuccess, data }
// envelope wrapping the created Chat.
export async function createChat(payload: ChatCreateDto): Promise<ChatSummary> {
  const token = getSavedToken();
  if (!token) throw new Error('No auth token found');

  try {
    const response = await api.post<ApiEnvelope<ChatSummary>>(
      '/chat',
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.data;
  } catch (err: any) {
    if (err.response?.data) {
      throw err.response.data;
    }
    throw err;
  }
}

// DELETE /api/chat/{chatId}/participants/{targetUserId} — admin-only.
export async function removeParticipant(chatId: string, targetUserId: string): Promise<ChatSummary> {
  const token = getSavedToken();
  if (!token) throw new Error('No auth token found');

  try {
    const response = await api.delete<ApiEnvelope<ChatSummary>>(
      `/chat/${chatId}/participants/${targetUserId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data.data;
  } catch (err: any) {
    if (err.response?.data) {
      throw err.response.data;
    }
    throw err;
  }
}

// POST /api/chat/{chatId}/leave — self-service; if the caller is the admin, the
// longest-standing remaining member is auto-promoted.
export async function leaveChat(chatId: string): Promise<ChatSummary> {
  const token = getSavedToken();
  if (!token) throw new Error('No auth token found');

  try {
    const response = await api.post<ApiEnvelope<ChatSummary>>(
      `/chat/${chatId}/leave`,
      null,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data.data;
  } catch (err: any) {
    if (err.response?.data) {
      throw err.response.data;
    }
    throw err;
  }
}

// PATCH /api/chat/{chatId} — admin-only; only non-null fields in details are applied.
export async function updateChatDetails(chatId: string, details: UpdateChatDetailsDto): Promise<ChatSummary> {
  const token = getSavedToken();
  if (!token) throw new Error('No auth token found');

  try {
    const response = await api.patch<ApiEnvelope<ChatSummary>>(
      `/chat/${chatId}`,
      details,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data.data;
  } catch (err: any) {
    if (err.response?.data) {
      throw err.response.data;
    }
    throw err;
  }
}
