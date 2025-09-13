import { User } from "../user";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  displayName: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user?: User;
  errors?: string[];
}

export interface RegisterResponse {
  success: boolean;
  token: string;
  user?: User;
  errors?: string[];
}
