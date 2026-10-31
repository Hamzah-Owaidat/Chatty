import { randomBytes } from "node:crypto";
import type { APIRequestContext } from "@playwright/test";

export const API_BASE_URL = process.env.E2E_API_BASE_URL ?? "https://localhost:7283/api";

export interface TestUser {
  userName: string;
  displayName: string;
  email: string;
  password: string;
}

interface ApiEnvelope<T> {
  isSuccess: boolean;
  statusCode: number;
  error: string | null;
  data: T;
}

/**
 * Generates a throwaway user. Names carry an `e2e_` prefix so these accounts are easy
 * to identify and exclude from real data. The password is random per run and never stored.
 */
export function makeTestUser(label: string): TestUser {
  const suffix = randomBytes(3).toString("hex");
  const userName = `e2e_${label}_${suffix}`;
  return {
    userName,
    displayName: `E2E ${label.toUpperCase()} ${suffix}`,
    email: `${userName}@example.test`,
    password: `Pw${randomBytes(6).toString("hex")}1`,
  };
}

export async function registerUser(request: APIRequestContext, user: TestUser): Promise<void> {
  const res = await request.post(`${API_BASE_URL}/auth/register`, {
    data: {
      userName: user.userName,
      displayName: user.displayName,
      email: user.email,
      password: user.password,
    },
  });
  const body = (await res.json()) as ApiEnvelope<string | null>;
  if (!res.ok() || !body.isSuccess) {
    throw new Error(`Failed to register test user ${user.userName}: ${body.error ?? res.status()}`);
  }
}

export async function loginToken(request: APIRequestContext, user: TestUser): Promise<string> {
  const res = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { userName: user.userName, password: user.password },
  });
  const body = (await res.json()) as ApiEnvelope<string | null>;
  if (!res.ok() || !body.isSuccess || !body.data) {
    throw new Error(`Failed to log in test user ${user.userName}: ${body.error ?? res.status()}`);
  }
  return body.data;
}
