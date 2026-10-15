"use client";
import { useEffect, useRef, useState } from "react";
import UserAvatar from "./UserAvatar";
import PresenceDot from "./PresenceDot";
import { useUserProfile } from "@/hooks/useUserProfile";
import { PresenceEntry } from "@/hooks/usePresence";
import { getPresenceLabel } from "@/utils/time";

interface UserHoverCardProps {
  userId: string;
  children: React.ReactNode;
  // Shown instantly (no loading flash) while the full profile fetch resolves.
  fallbackName?: string;
  fallbackImage?: string;
  // The caller's already-fetched live SignalR overlay for this one user — this component
  // never calls usePresence() itself, so each screen keeps exactly one listener instead of
  // one per rendered avatar.
  presence?: PresenceEntry;
  placement?: "bottom" | "right";
  disabled?: boolean;
}

const OPEN_DELAY = 350;
const CLOSE_DELAY = 200;

/**
 * Wraps an avatar (or any trigger) with a hover-triggered mini profile preview: picture,
 * background, display name, online/last-seen, and bio. The popover is rendered as a DOM
 * descendant of the same hover-bound element as the trigger, so moving the mouse from the
 * avatar onto the card itself never fires onMouseLeave — no flicker-close handling needed.
 */
export default function UserHoverCard({
  userId,
  children,
  fallbackName,
  fallbackImage,
  presence,
  placement = "bottom",
  disabled = false,
}: UserHoverCardProps) {
  const [open, setOpen] = useState(false);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { profile, loading } = useUserProfile(userId, open);

  useEffect(() => {
    return () => {
      if (openTimer.current) clearTimeout(openTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  if (disabled) return <>{children}</>;

  const handleMouseEnter = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    if (openTimer.current || open) return;
    openTimer.current = setTimeout(() => {
      openTimer.current = null;
      setOpen(true);
    }, OPEN_DELAY);
  };

  const handleMouseLeave = () => {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (closeTimer.current) return;
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null;
      setOpen(false);
    }, CLOSE_DELAY);
  };

  const name = profile?.displayName || fallbackName || "";
  const image = profile?.image || fallbackImage;
  const status = presence?.status ?? profile?.status;
  const lastSeenAt = presence?.lastSeenAt ?? profile?.lastSeenAt;

  const placementClass = placement === "right" ? "left-full top-0 ml-2" : "left-1/2 top-full mt-2 -translate-x-1/2";

  return (
    <span className="relative inline-flex shrink-0" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}

      {open && (
        <div
          role="dialog"
          className={`absolute z-50 w-64 animate-[floatIn_.15s_cubic-bezier(.2,.8,.2,1)_both] overflow-hidden rounded-2xl border border-gray-200/70 bg-white/90 shadow-[0_1px_2px_rgba(16,24,40,.04),0_24px_48px_-24px_rgba(16,24,40,.55)] backdrop-blur-md backdrop-saturate-150 dark:border-stone-800/70 dark:bg-stone-900/90 ${placementClass}`}
        >
          <div className="h-12 w-full">
            {profile?.backgroundImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote CDN URL
              <img src={profile.backgroundImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-accent-500 via-accent-600 to-accent-700" />
            )}
          </div>

          <div className="px-4 pb-4">
            <div className="-mt-6 mb-2 w-fit rounded-full border-[3px] border-white dark:border-stone-900">
              <UserAvatar src={image} name={name} size={44} />
            </div>

            <p className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">{name}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <PresenceDot status={status} size={8} />
              <span className="text-xs text-gray-500 dark:text-stone-400">{getPresenceLabel(status, lastSeenAt)}</span>
            </div>

            {loading && !profile ? (
              <div className="mt-2.5 space-y-1.5">
                <div className="h-2.5 w-full animate-pulse rounded bg-gray-200 dark:bg-stone-800" />
                <div className="h-2.5 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-stone-800" />
              </div>
            ) : (
              <p className="mt-2.5 line-clamp-2 text-xs text-gray-500 dark:text-stone-400">{profile?.bio || "No bio yet."}</p>
            )}
          </div>
        </div>
      )}
    </span>
  );
}
