"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Search, Send } from "lucide-react";
import { Modal } from "../ui/modal";
import { searchUsers } from "@/lib/api/user";
import { sendChatRequest } from "@/lib/api/chatRequest";
import { ChatParticipant } from "@/types/chat/chat.models";
import { getErrorMessage } from "@/utils/error";
import { showToast } from "@/utils/toast";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EASE = "ease-[cubic-bezier(.2,.8,.2,1)]";

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
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
      <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">New chat</h4>

      <div className="relative mb-4">
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email..."
          className={`w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none transition-all duration-200 ${EASE} placeholder-gray-400 focus:border-[#1a7b9b]/55 focus:ring-4 focus:ring-[#1a7b9b]/12 dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:placeholder-stone-500`}
        />
        <Search size={16} className="absolute left-3 top-3 text-gray-400 dark:text-stone-500" />
      </div>

      <div className="max-h-80 overflow-y-auto">
        {searching ? (
          <p className="py-6 text-center text-sm text-gray-500 dark:text-stone-400">Searching...</p>
        ) : query.trim().length < 2 ? (
          <p className="py-6 text-center text-sm text-gray-500 dark:text-stone-400">
            Type at least 2 characters to search.
          </p>
        ) : results.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500 dark:text-stone-400">No users found.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {results.map((user) => (
              <li key={user.id}>
                <button
                  onClick={() => handleSendRequest(user)}
                  disabled={sendingId === user.id}
                  className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors duration-150 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-white/5`}
                >
                  <Image
                    src={user.image || "/images/user/user-01.jpg"}
                    alt={user.displayName}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                  <span className="flex-1 truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                    {user.displayName}
                  </span>
                  <Send size={16} className="text-[#1a7b9b] dark:text-[#60c7e3]" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
