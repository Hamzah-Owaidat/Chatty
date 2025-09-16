import { getSavedToken } from '@/utils/authToken';
import api from './client';
import { LoginCredentials, RegisterData } from '@/types/auth/auth.models';

export async function login(credentials: LoginCredentials) {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data; // success
  } catch (err: any) {
    throw err;
  }
}

export async function register(data: RegisterData) {
    const response = await api.post('/auth/register', data);
    return response.data;
}

export async function logout(){
    const response = await api.post('/auth/logout');
    return response.data;
}

export async function getCurrentUser() {
  const token = getSavedToken();
  if (!token) throw new Error('No auth token found');

  const response = await api.get(
    '/auth/me',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
}
