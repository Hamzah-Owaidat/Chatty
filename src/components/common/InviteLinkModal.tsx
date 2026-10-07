"use client";
import React, { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Modal, ModalHeader } from "../ui/modal";
import { getOrCreateInviteLink } from "@/lib/api/invite";
import { getErrorMessage } from "@/utils/error";
import { showToast } from "@/utils/toast";

interface InviteLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BACKDROP = "fixed inset-0 h-full w-full bg-stone-950/30";
const PANEL =
  "relative flex w-[calc(100%-1.5rem)] max-w-md flex-col overflow-hidden rounded-2xl bg-white p-5 shadow-[0_24px_48px_-16px_rgba(16,24,40,.35)] ring-1 ring-black/5 animate-[floatIn_.2s_cubic-bezier(.2,.8,.2,1)_both] dark:bg-stone-900 dark:ring-white/10";

export default function InviteLinkModal({ isOpen, onClose }: InviteLinkModalProps) {
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setLink(null);
      setCopied(false);
      return;
    }

    const fetchLink = async () => {
      setLoading(true);
      try {
        const info = await getOrCreateInviteLink();
        setLink(`${window.location.origin}/invite/${info.token}`);
      } catch (err) {
        showToast.error(getErrorMessage(err));
        onClose();
      } finally {
        setLoading(false);
      }
    };

    fetchLink();
    // onClose is stable enough here — this effect should only re-run on isOpen toggling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      showToast.success("Invite link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast.error("Couldn't copy the link — copy it manually instead.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      panelClassName={PANEL}
      backdropClassName={BACKDROP}
    >
      <ModalHeader
        title="Invite via link"
        description="Anyone with this link can start a chat with you."
        onClose={onClose}
      />

      <div className="mt-4">
        {loading ? (
          <p className="py-4 text-center text-sm text-gray-500 dark:text-stone-400">Generating your link…</p>
        ) : link ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={link}
              onFocus={(e) => e.target.select()}
              className="min-w-0 flex-1 truncate rounded-xl bg-gray-100 px-3.5 py-2.5 text-sm text-gray-700 outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-[#1a7b9b]/50 dark:bg-stone-800 dark:text-gray-200 dark:focus:ring-[#2596bb]/60"
            />
            <button
              onClick={handleCopy}
              aria-label="Copy invite link"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1a7b9b] text-white transition hover:bg-[#166b87] active:scale-95 dark:bg-[#2596bb] dark:hover:bg-[#2085a6]"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
