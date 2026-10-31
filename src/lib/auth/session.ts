import axios from "axios";
import api from "@/lib/api/client";
import { stopSignalRConnection } from "@/lib/signalr/signalr";
import { getSavedToken, setAuthToken } from "@/utils/authToken";

// Why the user was sent back to sign in — read by SignInForm to explain it.
export type SessionEndReason = "expired" | "revoked";

let ending = false;

/**
 * Drops the local session and does a full navigation to sign in, which also resets the
 * Redux store. Used when the backend stops accepting the token: it expired (30 min),
 * or "log out of all devices" bumped the account's token version.
 */
export async function endSession(reason: SessionEndReason): Promise<void> {
  if (ending || typeof window === "undefined") return;
  ending = true;

  setAuthToken(null);
  await stopSignalRConnection();

  const { pathname, search } = window.location;
  const params = new URLSearchParams({ session: reason });
  // Come back to where they were, except from the auth pages themselves.
  if (!pathname.startsWith("/auth")) params.set("redirect", pathname + search);

  window.location.replace(`/auth/signin?${params.toString()}`);
}

let installed = false;

/**
 * Any 401 while a token is stored means the backend rejected that token, so the
 * session is over. Installed once, from AuthProvider.
 */
export function installSessionGuard(): void {
  if (installed) return;
  installed = true;

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 401 && getSavedToken()) {
        void endSession("expired");
      }
      return Promise.reject(error);
    }
  );
}
