"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
const CARD_WIDTH = 256; // w-64
const VIEWPORT_MARGIN = 8;

interface Coords {
  top: number;
  left: number;
}

/**
 * Wraps an avatar (or any trigger) with a hover-triggered mini profile preview: picture,
 * background, display name, online/last-seen, and bio.
 *
 * The popover is rendered through a portal into `document.body` and positioned with
 * `position: fixed` from the trigger's live bounding rect — triggers routinely sit inside
 * scroll-clipped or virtualized containers (sidebars, message lists, member lists), and an
 * `absolute` popover would get clipped by (or scroll away with) that ancestor instead of
 * floating above the whole page.
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
  const [coords, setCoords] = useState<Coords | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const { profile, loading } = useUserProfile(userId, open);

  useEffect(() => {
    return () => {
      if (openTimer.current) clearTimeout(openTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  // Recomputes on open and tracks every scroll/resize while visible — including scroll on
  // an ancestor (e.g. the virtualized list the trigger lives in), since scroll events don't
  // bubble but are still observable in the capture phase at the window.
  useLayoutEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();

      if (placement === "right") {
        setCoords({ top: rect.top, left: rect.right + 8 });
      } else {
        const left = Math.min(
          Math.max(rect.left + rect.width / 2 - CARD_WIDTH / 2, VIEWPORT_MARGIN),
          window.innerWidth - CARD_WIDTH - VIEWPORT_MARGIN
        );
        setCoords({ top: rect.bottom + 8, left });
      }
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, placement]);

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

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex shrink-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {open &&
        coords &&
        createPortal(
          <div
            role="dialog"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ top: coords.top, left: coords.left }}
            className="fixed z-[999] w-64 animate-[floatIn_.15s_cubic-bezier(.2,.8,.2,1)_both] overflow-hidden rounded-2xl border border-gray-200/70 bg-white/90 shadow-[0_1px_2px_rgba(16,24,40,.04),0_24px_48px_-24px_rgba(16,24,40,.55)] backdrop-blur-md backdrop-saturate-150 dark:border-stone-800/70 dark:bg-stone-900/90"
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
          </div>,
          document.body
        )}
    </span>
  );
}
