import api from "@/lib/api/client";

/**
 * Central helper to set/remove Authorization header and persist token.
 * Use this from thunks and on app bootstrap.
 */

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
    }
  } else {
    delete api.defaults.headers.common["Authorization"];
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
  }
}

/** Read token from localStorage (safe-guard for SSR) */
export function getSavedToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}
