"use client";
import { useEffect, useState } from "react";
import { getUserProfile } from "@/lib/api/user";
import { UserProfile } from "@/types/user";

// Shared across every component for the whole session, keyed by userId — re-hovering or
// re-opening the same user's profile never refetches it.
const cache = new Map<string, UserProfile>();
const inFlight = new Map<string, Promise<UserProfile>>();

function loadProfile(userId: string): Promise<UserProfile> {
  const cached = cache.get(userId);
  if (cached) return Promise.resolve(cached);

  let promise = inFlight.get(userId);
  if (!promise) {
    promise = getUserProfile(userId)
      .then((profile) => {
        cache.set(userId, profile);
        return profile;
      })
      .catch((err) => {
        inFlight.delete(userId); // let the next attempt retry
        throw err;
      });
    inFlight.set(userId, promise);
  }
  return promise;
}

interface UseUserProfileResult {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * Another user's read-only profile (GET /user/{id}), fetched lazily — only once `enabled`
 * is true — and cached for the rest of the session. Used by UserHoverCard (enabled once the
 * hover open-delay fires) and ProfileViewModal (enabled while open).
 */
export function useUserProfile(userId: string | undefined, enabled: boolean): UseUserProfileResult {
  const [profile, setProfile] = useState<UserProfile | null>(userId ? cache.get(userId) ?? null : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled || !userId) return;

    const cached = cache.get(userId);
    if (cached) {
      setProfile(cached);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    loadProfile(userId)
      .then((loaded) => {
        if (active) setProfile(loaded);
      })
      .catch(() => {
        if (active) setError("Couldn't load this profile.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId, enabled, attempt]);

  return { profile, loading, error, retry: () => setAttempt((a) => a + 1) };
}
