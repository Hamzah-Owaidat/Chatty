import { getSavedToken } from '@/utils/authToken';
import api from './client';
import { ChatMessage, SendMessageRequest } from '@/types/chat/chat.models';

export async function sendMessage(chatId: string, content: string, senderId?: string): Promise<ChatMessage> {
  const token = getSavedToken();
  if (!token) throw new Error('No auth token found');

  try {
    // Build request body - backend requires Content and SenderId (PascalCase)
    const requestBody: { Content: string; SenderId?: string } = { Content: content };
    if (senderId) {
      requestBody.SenderId = senderId;
    }
    
    console.log('🌐 API Request: POST /chat/' + chatId + '/message', requestBody);
    const response = await api.post(
      `/chat/${chatId}/message`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    console.log('📥 API Response received:', response.data);
    
    // Handle API response structure
    const data = response.data;
    
    // If response has isSuccess wrapper
    if (data?.isSuccess && data?.data) {
      console.log('✅ Message sent successfully. Response:', data.data);
      return data.data;
    }
    
    // If response.data exists
    if (data?.data) {
      console.log('✅ Message sent successfully. Response:', data.data);
      return data.data;
    }
    
    // Direct response
    console.log('✅ Message sent successfully. Response:', data);
    return data;
  } catch (err: any) {
    console.error('❌ API Error sending message:', err);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
      if (err.response.data) {
        throw err.response.data;
      }
    }
    throw err;
  }
}

export async function getMessages(chatId: string): Promise<ChatMessage[]> {
  const token = getSavedToken();
  if (!token) throw new Error('No auth token found');

  try {
    const response = await api.get(
      `/chat/${chatId}/message`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    // Handle API response structure
    const data = response.data;
    
    // If response has isSuccess wrapper
    if (data?.isSuccess && data?.data && Array.isArray(data.data)) {
      return data.data;
    }
    
    // If response.data is an array
    if (data?.data && Array.isArray(data.data)) {
      return data.data;
    }
    
    // If data is directly an array
    if (Array.isArray(data)) {
      return data;
    }
    
    console.warn('Unexpected message response structure:', data);
    return [];
  } catch (err: any) {
    console.error('Error fetching messages:', err);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
      if (err.response.data) {
        throw err.response.data;
      }
    }
    throw err;
  }
}
