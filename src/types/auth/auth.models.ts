// Login credentials
export interface LoginCredentials {
  userName: string;
  password: string;
}

// Registration data
export interface RegisterData {
  userName: string;
  displayName: string;
  email: string;
  password: string;
}

export interface ConfirmEmailPayload {
  token: string;
}

export interface ResendConfirmationPayload {
  email: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

// Base API response (Result<T>)
export interface ApiResponse<T> {
  isSuccess: boolean;
  statusCode: number;
  error: string | null;
  data: T;
}

// Non-generic Result — no data payload, just a human-readable message
export interface MessageResponse {
  isSuccess: boolean;
  statusCode: number;
  error: string | null;
  message: string | null;
}

export type LoginResponse = ApiResponse<string | null>;

// Register no longer auto-logs in — backend returns a message, not a token
export type RegisterResponse = MessageResponse;
