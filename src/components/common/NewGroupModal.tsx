"use client";
import React, { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Modal } from "../ui/modal";
import { searchUsers } from "@/lib/api/user";
import { createChat } from "@/lib/api/chat";
import { ChatParticipant } from "@/types/chat/chat.models";
import { getErrorMessage } from "@/utils/error";
import { showToast } from "@/utils/toast";
import { useAppSelector } from "@/store/hooks";
import { useChat } from "@/context/ChatContext";
import UserAvatar from "@/components/common/UserAvatar";

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EASE = "ease-[cubic-bezier(.2,.8,.2,1)]";

export default function NewGroupModal({ isOpen, onClose }: NewGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [groupImage, setGroupImage] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ChatParticipant[]>([]);
  const [selected, setSelected] = useState<ChatParticipant[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const currentUser = useAppSelector((state) => state.auth.user);
  const { refreshChatList } = useChat();

  useEffect(() => {
    if (!isOpen) {
      setGroupName("");
      setGroupImage("");
      setQuery("");
      setResults([]);
      setSelected([]);
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

  const toggleSelected = (user: ChatParticipant) => {
    setSelected((prev) =>
      prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user]
    );
  };

  const handleCreate = async () => {
    if (!currentUser) return;
    if (!groupName.trim()) {
      showToast.error("Group name is required");
      return;
    }
    if (selected.length < 1) {
      showToast.error("Pick at least 1 person to invite");
      return;
    }

    setCreating(true);
    try {
      // Only the caller joins immediately (as admin) — everyone else selected gets
      // sent a chat request and joins once they accept it.
      await createChat({
        isGroupChat: true,
        groupName: groupName.trim(),
        groupImage: groupImage.trim() || undefined,
        participantsIds: [currentUser.id, ...selected.map((u) => u.id)],
        adminId: currentUser.id,
      });
      showToast.success("Group created — invites sent to the people you picked");
      refreshChatList();
      onClose();
    } catch (err) {
      showToast.error(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const availableResults = results.filter((u) => !selected.some((s) => s.id === u.id));

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
      <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">New group</h4>

      <input
        type="text"
        autoFocus
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
        placeholder="Group name"
        className={`mb-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition-all duration-200 ${EASE} placeholder-gray-400 focus:border-[#1a7b9b]/55 focus:ring-4 focus:ring-[#1a7b9b]/12 dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:placeholder-stone-500`}
      />

      <input
        type="text"
        value={groupImage}
        onChange={(e) => setGroupImage(e.target.value)}
        placeholder="Group image URL (optional)"
        className={`mb-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition-all duration-200 ${EASE} placeholder-gray-400 focus:border-[#1a7b9b]/55 focus:ring-4 focus:ring-[#1a7b9b]/12 dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:placeholder-stone-500`}
      />

      {selected.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selected.map((user) => (
            <span
              key={user.id}
              className="flex items-center gap-1.5 rounded-full bg-[#1a7b9b]/10 py-1 pl-1 pr-2 text-xs font-medium text-[#1a7b9b] dark:bg-[#2596bb]/15 dark:text-[#60c7e3]"
            >
              <UserAvatar src={user.image} name={user.displayName} size={20} />
              {user.displayName}
              <button onClick={() => toggleSelected(user)} aria-label={`Remove ${user.displayName}`}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      {selected.length > 0 && (
        <p className="-mt-2 mb-3 text-xs text-gray-500 dark:text-stone-400">
          They&apos;ll receive an invite and join once they accept it.
        </p>
      )}

      <div className="relative mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people to invite..."
          className={`w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none transition-all duration-200 ${EASE} placeholder-gray-400 focus:border-[#1a7b9b]/55 focus:ring-4 focus:ring-[#1a7b9b]/12 dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:placeholder-stone-500`}
        />
        <Search size={16} className="absolute left-3 top-3 text-gray-400 dark:text-stone-500" />
      </div>

      <div className="mb-4 max-h-56 overflow-y-auto">
        {searching ? (
          <p className="py-6 text-center text-sm text-gray-500 dark:text-stone-400">Searching...</p>
        ) : query.trim().length < 2 ? (
          <p className="py-6 text-center text-sm text-gray-500 dark:text-stone-400">
            Type at least 2 characters to search.
          </p>
        ) : availableResults.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500 dark:text-stone-400">No users found.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {availableResults.map((user) => (
              <li key={user.id}>
                <button
                  onClick={() => toggleSelected(user)}
                  className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  <UserAvatar src={user.image} name={user.displayName} size={40} />
                  <span className="flex-1 truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                    {user.displayName}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={handleCreate}
        disabled={creating}
        className={`flex w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#1f88aa] via-[#1a7b9b] to-[#17708d] py-2.5 text-sm font-medium text-white transition-all duration-200 ${EASE} hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50`}
      >
        {creating ? "Creating..." : "Create group"}
      </button>
    </Modal>
  );
}
