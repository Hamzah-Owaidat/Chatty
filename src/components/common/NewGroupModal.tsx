"use client";
import React, { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Modal, ModalHeader } from "../ui/modal";
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

const BACKDROP = "fixed inset-0 h-full w-full bg-stone-950/30";
const PANEL =
  "relative flex max-h-[80dvh] w-[calc(100%-1.5rem)] max-w-md flex-col overflow-hidden rounded-2xl bg-white p-5 shadow-[0_24px_48px_-16px_rgba(16,24,40,.35)] ring-1 ring-black/5 animate-[floatIn_.2s_cubic-bezier(.2,.8,.2,1)_both] dark:bg-stone-900 dark:ring-white/10";
const FIELD =
  "w-full rounded-xl bg-gray-100 px-3.5 py-2.5 text-sm text-gray-900 outline-none ring-1 ring-transparent transition placeholder:text-gray-400 focus:bg-white focus:ring-[#1a7b9b]/50 dark:bg-stone-800 dark:text-white dark:placeholder:text-stone-500 dark:focus:ring-[#2596bb]/60";

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      panelClassName={PANEL}
      backdropClassName={BACKDROP}
    >
      <ModalHeader
        title="New group"
        description="Name it, then invite people."
        onClose={onClose}
      />

      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex flex-col gap-2.5">
          <input
            type="text"
            autoFocus
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name"
            className={FIELD}
          />
          <input
            type="text"
            value={groupImage}
            onChange={(e) => setGroupImage(e.target.value)}
            placeholder="Image URL (optional)"
            className={FIELD}
          />
        </div>

        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people to invite"
            className={`${FIELD} pl-10`}
          />
          <Search size={16} className="absolute left-3.5 top-3 text-gray-400 dark:text-stone-500" />
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selected.map((user) => (
              <span
                key={user.id}
                className="flex items-center gap-1.5 rounded-full bg-[#1a7b9b]/10 py-1 pl-1 pr-1.5 text-xs font-medium text-[#1a7b9b] dark:bg-[#2596bb]/15 dark:text-[#60c7e3]"
              >
                <UserAvatar 
                  src={user.image} 
                  name={user.displayName} 
                  size={18} 
                />
                {user.displayName}
                <button
                  onClick={() => toggleSelected(user)}
                  aria-label={`Remove ${user.displayName}`}
                  className="rounded-full p-0.5 transition hover:bg-[#1a7b9b]/15 dark:hover:bg-white/10"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="-mx-2 min-h-0 flex-1 overflow-y-auto px-2">
          {searching ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-stone-400">Searching…</p>
          ) : query.trim().length < 2 ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-stone-400">
              Type at least 2 characters to search.
            </p>
          ) : availableResults.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-stone-400">No users found.</p>
          ) : (
            <ul className="flex flex-col">
              {availableResults.map((user) => (
                <li key={user.id}>
                  <button
                    onClick={() => toggleSelected(user)}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-gray-100 dark:hover:bg-white/5"
                  >
                    <UserAvatar 
                      src={user.image} 
                      name={user.displayName} 
                      size={36} 
                    />
                    <span className="flex-1 truncate text-sm font-medium text-gray-900 dark:text-gray-100">
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
          className="mt-1 w-full rounded-xl bg-[#1a7b9b] py-2.5 text-sm font-medium text-white transition hover:bg-[#166b87] disabled:pointer-events-none disabled:opacity-50 dark:bg-[#2596bb] dark:hover:bg-[#2085a6]"
        >
          {creating ? "Creating…" : "Create group"}
        </button>
      </div>
    </Modal>
  );
}
