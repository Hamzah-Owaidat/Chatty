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

// Base API response
export interface ApiResponse<T> {
  isSuccess: boolean;
  statusCode: number;
  error: string | null;
  data: T;
}

export type LoginResponse = ApiResponse<string | null>;

// Register response (data = Token only)
export type RegisterResponse = ApiResponse<string | null>;
