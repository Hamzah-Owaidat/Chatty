import axios from 'axios';
import { getSavedToken } from '@/utils/authToken';
import api from './client';
import {
  LoginCredentials,
  RegisterData,
  ConfirmEmailPayload,
  ResendConfirmationPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '@/types/auth/auth.models';

// Backend action routes are PascalCase with no separators (e.g. ConfirmEmail),
// matched case-insensitively — a dashed path like "confirm-email" will NOT match.
function rethrowApiError(err: unknown): never {
  if (axios.isAxiosError(err) && err.response?.data) {
    throw err.response.data;
  }
  throw err;
}

export async function login(credentials: LoginCredentials) {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (err) {
    rethrowApiError(err);
  }
}

export async function register(data: RegisterData) {
  try {
    const response = await api.post('/auth/register', data);
    return response.data;
  } catch (err) {
    rethrowApiError(err);
  }
}

export async function confirmEmail(payload: ConfirmEmailPayload) {
  try {
    const response = await api.post('/auth/confirmemail', payload);
    return response.data;
  } catch (err) {
    rethrowApiError(err);
  }
}

export async function resendConfirmationEmail(payload: ResendConfirmationPayload) {
  try {
    const response = await api.post('/auth/resendconfirmationemail', payload);
    return response.data;
  } catch (err) {
    rethrowApiError(err);
  }
}

export async function forgotPassword(payload: ForgotPasswordPayload) {
  try {
    const response = await api.post('/auth/forgotpassword', payload);
    return response.data;
  } catch (err) {
    rethrowApiError(err);
  }
}

export async function resetPassword(payload: ResetPasswordPayload) {
  try {
    const response = await api.post('/auth/resetpassword', payload);
    return response.data;
  } catch (err) {
    rethrowApiError(err);
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
