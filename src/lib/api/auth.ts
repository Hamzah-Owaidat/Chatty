import axios from 'axios';
import { getSavedToken } from '@/utils/authToken';
import api from './client';
import { LoginCredentials, RegisterData } from '@/types/auth/auth.models';

export async function login(credentials: LoginCredentials) {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (err: any) {
    // For failed requests that return error responses (400, 401, etc.)
    if (err.response?.data) {
      throw err.response.data; // ✅ Throw the actual response data
    }
    // For network errors or other issues
    throw err;
  }
}

export async function register(data: RegisterData) {
  try {
    const response = await api.post('/auth/register', data);
    return response.data;
  } catch (err: any) {
    if (err.response?.data) {
      throw err.response.data;
    }
    throw err;
  }
}

export async function requestPasswordReset(email: string) {
  try {
    // TODO: confirm backend endpoint path for initiating a password reset
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      throw err.response.data;
    }
    throw err;
  }
}

export async function resetPassword(payload: { token: string; password: string }) {
  try {
    // TODO: confirm backend endpoint path for completing a password reset
    const response = await api.post('/auth/reset-password', payload);
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.data) {
      throw err.response.data;
    }
    throw err;
  }
}

export async function getCurrentUser() {
  const token = getSavedToken();
  if (!token) throw new Error('No auth token found');

  const response = await api.get(
    '/user/me',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
}
