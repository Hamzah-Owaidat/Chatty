"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Modal } from "../ui/modal";
import UserAvatar from "./UserAvatar";
import PresenceDot from "./PresenceDot";
import { useUserProfile } from "@/hooks/useUserProfile";
import { PresenceEntry } from "@/hooks/usePresence";
import { getPresenceLabel } from "@/utils/time";
import { showToast } from "@/utils/toast";

interface ProfileViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  // The caller's already-fetched live SignalR overlay for this user (see ChatWindow's
  // peerPresence) — overrides the fetched profile's own status/lastSeenAt once available.
  presence?: PresenceEntry;
}

const PANEL_CLASSES =
  "w-full max-w-md overflow-hidden rounded-3xl shadow-[0_24px_48px_-16px_rgba(16,24,40,.35)] ring-1 ring-black/5 animate-[floatIn_.2s_cubic-bezier(.2,.8,.2,1)_both] dark:ring-white/10";

/**
 * Read-only "Contact Info" view of another user's profile: background, picture, display
 * name, online/last-seen, and bio. Opened from the chat-options dropdown for 1:1 chats.
 */
export default function ProfileViewModal({ isOpen, onClose, userId, presence }: ProfileViewModalProps) {
  const { profile, loading, error, retry } = useUserProfile(userId, isOpen && !!userId);
  const [copied, setCopied] = useState(false);

  const status = presence?.status ?? profile?.status;
  const lastSeenAt = presence?.lastSeenAt ?? profile?.lastSeenAt;

  const handleCopyUsername = () => {
    if (!profile) return;
    navigator.clipboard
      .writeText(profile.userName)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => showToast.error("Couldn't copy username"));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={PANEL_CLASSES}>
      {loading && !profile ? (
        <div>
          <div className="h-32 w-full animate-pulse bg-gray-200 dark:bg-stone-800" />
          <div className="px-6 pb-7">
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
          <div className="relative h-32 w-full">
            {profile.backgroundImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote CDN URL
              <img src={profile.backgroundImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-accent-500 via-accent-600 to-accent-700" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
          </div>

          <div className="px-6 pb-7">
            <div className="-mt-12 w-fit rounded-full border-4 border-white dark:border-[#201d1b]">
              <div className="relative">
                <UserAvatar src={profile.image} name={profile.displayName || profile.userName} size={88} />
                <span className="absolute bottom-0 right-0">
                  <PresenceDot status={status} size={18} />
                </span>
              </div>
            </div>

            <div className="mt-3.5">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">{profile.displayName}</h4>
              <div className="mt-0.5 flex items-center gap-1">
                <p className="text-sm text-gray-500 dark:text-stone-400">@{profile.userName}</p>
                <button
                  type="button"
                  onClick={handleCopyUsername}
                  aria-label={copied ? "Username copied" : "Copy username"}
                  title={copied ? "Copied!" : "Copy username"}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-stone-500 dark:hover:bg-white/5 dark:hover:text-stone-300"
                >
                  {copied ? <Check size={13} className="text-success-500" /> : <Copy size={13} />}
                </button>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <PresenceDot status={status} size={8} />
                <span className="text-xs text-gray-500 dark:text-stone-400">{getPresenceLabel(status, lastSeenAt)}</span>
              </div>
            </div>

            <div className="mt-5">
              <h5 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-stone-400">About</h5>
              <p
                className={`rounded-xl bg-gray-50 px-3.5 py-3 text-sm leading-relaxed dark:bg-stone-800/60 ${
                  profile.bio ? "text-gray-700 dark:text-stone-300" : "text-gray-400 italic dark:text-stone-500"
                }`}
              >
                {profile.bio || "No bio yet."}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
