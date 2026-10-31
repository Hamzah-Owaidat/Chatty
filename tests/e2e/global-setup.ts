import type { FullConfig } from "@playwright/test";

const ROUTES = ["/auth/signin", "/auth/signup", "/auth/reset-password", "/chat", "/profile", "/invite/warmup"];

/**
 * The Next.js dev server compiles each route on its first request. Warming the routes here keeps
 * that one-time compile out of the timed assertions in the test files.
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use.baseURL ?? "http://localhost:3000";
  for (const route of ROUTES) {
    await fetch(new URL(route, baseURL), { signal: AbortSignal.timeout(240_000) }).catch(() => undefined);
  }
}
