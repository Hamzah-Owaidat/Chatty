"use client";
import { Modal } from "../ui/modal";
import UserAvatar from "./UserAvatar";
import PresenceDot from "./PresenceDot";
import { useUserProfile } from "@/hooks/useUserProfile";
import { PresenceEntry } from "@/hooks/usePresence";
import { getPresenceLabel } from "@/utils/time";

interface ProfileViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  // The caller's already-fetched live SignalR overlay for this user (see ChatWindow's
  // peerPresence) — overrides the fetched profile's own status/lastSeenAt once available.
  presence?: PresenceEntry;
}

/**
 * Read-only "Contact Info" view of another user's profile: background, picture, display
 * name, online/last-seen, and bio. Opened from the chat-options dropdown for 1:1 chats.
 */
export default function ProfileViewModal({ isOpen, onClose, userId, presence }: ProfileViewModalProps) {
  const { profile, loading, error, retry } = useUserProfile(userId, isOpen && !!userId);

  const status = presence?.status ?? profile?.status;
  const lastSeenAt = presence?.lastSeenAt ?? profile?.lastSeenAt;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-md overflow-hidden rounded-3xl">
      {loading && !profile ? (
        <div>
          <div className="h-28 w-full animate-pulse bg-gray-200 dark:bg-stone-800" />
          <div className="px-6 pb-6">
            <div className="-mt-12 h-[88px] w-[88px] animate-pulse rounded-full border-4 border-white bg-gray-300 dark:border-[#201d1b] dark:bg-stone-700" />
            <div className="mt-4 space-y-2">
              <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-stone-800" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-stone-800" />
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 p-10 text-center">
          <p className="text-sm text-gray-500 dark:text-stone-400">{error}</p>
          <button
            type="button"
            onClick={retry}
            className="rounded-xl bg-gradient-to-br from-accent-500 via-accent-600 to-accent-700 px-4 py-2 text-sm font-medium text-white"
          >
            Try again
          </button>
        </div>
      ) : profile ? (
        <div>
          <div className="h-28 w-full">
            {profile.backgroundImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote CDN URL
              <img src={profile.backgroundImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-accent-500 via-accent-600 to-accent-700" />
            )}
          </div>

          <div className="px-6 pb-6">
            <div className="-mt-12 rounded-full border-4 border-white dark:border-[#201d1b]">
              <UserAvatar src={profile.image} name={profile.displayName || profile.userName} size={88} />
            </div>

            <div className="mt-3">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">{profile.displayName}</h4>
              <p className="text-sm text-gray-500 dark:text-stone-400">@{profile.userName}</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <PresenceDot status={status} size={9} />
                <span className="text-xs text-gray-500 dark:text-stone-400">{getPresenceLabel(status, lastSeenAt)}</span>
              </div>
            </div>

            <div className="mt-5">
              <h5 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-stone-400">Bio</h5>
              <p className="text-sm text-gray-700 dark:text-stone-300">{profile.bio || "No bio yet."}</p>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
