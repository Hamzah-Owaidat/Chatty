import { User } from "../user";

export interface AuthState {
  user: User | null;
  token: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error?: string | null;
  initialized: boolean; // Track if auth has been initialized
}