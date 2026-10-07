"use client";
import React, { useEffect, useRef, useState } from "react";
import { Search, Send } from "lucide-react";
import { Modal, ModalHeader } from "../ui/modal";
import { searchUsers } from "@/lib/api/user";
import { sendChatRequest } from "@/lib/api/chatRequest";
import { ChatParticipant } from "@/types/chat/chat.models";
import { getErrorMessage } from "@/utils/error";
import { showToast } from "@/utils/toast";
import UserAvatar from "@/components/common/UserAvatar";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BACKDROP = "fixed inset-0 h-full w-full bg-stone-950/30";
const PANEL =
  "relative flex max-h-[80dvh] w-[calc(100%-1.5rem)] max-w-md flex-col overflow-hidden rounded-2xl bg-white p-5 shadow-[0_24px_48px_-16px_rgba(16,24,40,.35)] ring-1 ring-black/5 animate-[floatIn_.2s_cubic-bezier(.2,.8,.2,1)_both] dark:bg-stone-900 dark:ring-white/10";
const FIELD =
  "w-full rounded-xl bg-gray-100 py-2.5 pl-10 pr-3.5 text-sm text-gray-900 outline-none ring-1 ring-transparent transition placeholder:text-gray-400 focus:bg-white focus:ring-[#1a7b9b]/50 dark:bg-stone-800 dark:text-white dark:placeholder:text-stone-500 dark:focus:ring-[#2596bb]/60";

export default function NewChatModal({ isOpen, onClose }: NewChatModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ChatParticipant[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setSendingId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const users = await searchUsers(trimmed);
        setResults(users);
      } catch (err) {
        showToast.error(getErrorMessage(err));
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSendRequest = async (user: ChatParticipant) => {
    setSendingId(user.id);
    try {
      await sendChatRequest(user.id);
      showToast.success(`Chat request sent to ${user.displayName}`);
      onClose();
    } catch (err) {
      showToast.error(getErrorMessage(err));
    } finally {
      setSendingId(null);
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
      <ModalHeader title="New chat" onClose={onClose} />

      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3">
        <div className="relative">
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
            className={FIELD}
          />
          <Search size={16} className="absolute left-3.5 top-3 text-gray-400 dark:text-stone-500" />
        </div>

        <div className="-mx-2 min-h-0 flex-1 overflow-y-auto px-2">
          {searching ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-stone-400">Searching…</p>
          ) : query.trim().length < 2 ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-stone-400">
              Type at least 2 characters to search.
            </p>
          ) : results.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-stone-400">No users found.</p>
          ) : (
            <ul className="flex flex-col">
              {results.map((user) => (
                <li key={user.id}>
                  <button
                    onClick={() => handleSendRequest(user)}
                    disabled={sendingId === user.id}
                    className="group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-white/5"
                  >
                    <UserAvatar 
                      src={user.image} 
                      name={user.displayName} 
                      size={36} 
                    />
                    <span className="flex-1 truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.displayName}
                    </span>
                    <Send
                      size={15}
                      className="shrink-0 text-gray-400 transition group-hover:text-[#1a7b9b] dark:text-stone-500 dark:group-hover:text-[#60c7e3]"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
