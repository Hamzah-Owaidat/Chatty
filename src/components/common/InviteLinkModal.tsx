"use client";
import React, { useEffect, useState } from "react";
import { Link2, Copy, Check } from "lucide-react";
import { Modal } from "../ui/modal";
import { getOrCreateInviteLink } from "@/lib/api/invite";
import { getErrorMessage } from "@/utils/error";
import { showToast } from "@/utils/toast";

interface InviteLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EASE = "ease-[cubic-bezier(.2,.8,.2,1)]";

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
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
      <h4 className="mb-2 flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-white/90">
        <Link2 size={18} className="text-[#1a7b9b] dark:text-[#60c7e3]" />
        Invite via link
      </h4>
      <p className="mb-4 text-sm text-gray-500 dark:text-stone-400">
        Anyone with this link can start a chat with you directly.
      </p>

      {loading ? (
        <p className="py-4 text-center text-sm text-gray-500 dark:text-stone-400">Generating your link...</p>
      ) : link ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={link}
            onFocus={(e) => e.target.select()}
            className={`w-full min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-gray-200`}
          />
          <button
            onClick={handleCopy}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1a7b9b] text-white transition-all duration-200 ${EASE} hover:-translate-y-0.5 hover:shadow-[0_10px_18px_-10px_rgba(26,123,155,.7)] active:scale-95 dark:bg-[#2596bb]`}
            aria-label="Copy invite link"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      ) : null}
    </Modal>
  );
}
