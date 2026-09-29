"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Crown, LogOut, Search, ShieldMinus, ShieldPlus, UserPlus, UserMinus, Users } from "lucide-react";
import { Modal } from "../ui/modal";
import { searchUsers } from "@/lib/api/user";
import { removeParticipant, updateChatDetails, leaveChat, promoteParticipant, demoteParticipant } from "@/lib/api/chat";
import { sendChatRequest } from "@/lib/api/chatRequest";
import { ChatParticipant } from "@/types/chat/chat.models";
import { getErrorMessage } from "@/utils/error";
import { showToast } from "@/utils/toast";
import { useAppSelector } from "@/store/hooks";
import { useChat } from "@/context/ChatContext";

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
}

const EASE = "ease-[cubic-bezier(.2,.8,.2,1)]";

export default function GroupInfoModal({ isOpen, onClose, chatId }: GroupInfoModalProps) {
  const { activeChat, setActiveChat, setActiveUserId, refreshChatList } = useChat();
  const currentUser = useAppSelector((state) => state.auth.user);

  const [groupName, setGroupName] = useState("");
  const [groupImage, setGroupImage] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ChatParticipant[]>([]);
  const [searching, setSearching] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [roleChangingId, setRoleChangingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const isAdmin = !!currentUser && !!activeChat?.adminIds?.includes(currentUser.id);

  useEffect(() => {
    if (isOpen) {
      setGroupName(activeChat?.name || "");
      setGroupImage(activeChat?.groupImage || "");
      setQuery("");
      setResults([]);
    }
    // Only reset when the modal opens for this chat — activeChat updates in place
    // afterwards (e.g. right after a successful save) and shouldn't stomp the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    clearTimeout(debounceRef.current);

    if (!isAdmin) {
      setResults([]);
      return;
    }

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
  }, [query, isAdmin]);

  if (!activeChat) return null;

  const members: ChatParticipant[] = currentUser
    ? [
        { id: currentUser.id, displayName: currentUser.displayName || "You", image: currentUser.image || "" },
        ...(activeChat.participants || []),
      ]
    : activeChat.participants || [];

  const memberIds = new Set(members.map((m) => m.id));
  const availableResults = results.filter((u) => !memberIds.has(u.id));

  const handleSaveDetails = async () => {
    if (!groupName.trim()) {
      showToast.error("Group name is required");
      return;
    }

    setSavingDetails(true);
    try {
      const updated = await updateChatDetails(chatId, {
        groupName: groupName.trim(),
        groupImage: groupImage.trim(),
      });
      setActiveChat({
        ...activeChat,
        name: updated.groupName || activeChat.name,
        groupImage: updated.groupImage,
        avatar: updated.groupImage || activeChat.avatar,
      });
      refreshChatList();
      showToast.success("Group details updated");
    } catch (err) {
      showToast.error(getErrorMessage(err));
    } finally {
      setSavingDetails(false);
    }
  };

  const handleInvite = async (user: ChatParticipant) => {
    setInvitingId(user.id);
    try {
      await sendChatRequest(user.id, chatId);
      showToast.success(`Invite sent to ${user.displayName}`);
      setResults((prev) => prev.filter((u) => u.id !== user.id));
      setQuery("");
    } catch (err) {
      showToast.error(getErrorMessage(err));
    } finally {
      setInvitingId(null);
    }
  };

  const handleRemove = async (user: ChatParticipant) => {
    setRemovingId(user.id);
    try {
      const updated = await removeParticipant(chatId, user.id);
      setActiveChat({
        ...activeChat,
        adminIds: updated.adminIds,
        participants: (activeChat.participants || []).filter((p) => p.id !== user.id),
      });
      refreshChatList();
      showToast.success(`Removed ${user.displayName} from the group`);
    } catch (err) {
      showToast.error(getErrorMessage(err));
    } finally {
      setRemovingId(null);
    }
  };

  const handlePromote = async (user: ChatParticipant) => {
    setRoleChangingId(user.id);
    try {
      const updated = await promoteParticipant(chatId, user.id);
      setActiveChat({ ...activeChat, adminIds: updated.adminIds });
      refreshChatList();
      showToast.success(`${user.displayName} is now an admin`);
    } catch (err) {
      showToast.error(getErrorMessage(err));
    } finally {
      setRoleChangingId(null);
    }
  };

  const handleDemote = async (user: ChatParticipant) => {
    setRoleChangingId(user.id);
    try {
      const updated = await demoteParticipant(chatId, user.id);
      setActiveChat({ ...activeChat, adminIds: updated.adminIds });
      refreshChatList();
      showToast.success(`${user.displayName} is no longer an admin`);
    } catch (err) {
      showToast.error(getErrorMessage(err));
    } finally {
      setRoleChangingId(null);
    }
  };

  const handleLeave = async () => {
    setLeaving(true);
    try {
      await leaveChat(chatId);
      showToast.success(`You left ${activeChat.name}`);
      onClose();
      setActiveChat(null);
      setActiveUserId(null);
      refreshChatList();
    } catch (err) {
      showToast.error(getErrorMessage(err));
    } finally {
      setLeaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-h-[85vh] max-w-md overflow-y-auto p-6">
      <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-white/90">
        <Users size={18} className="text-[#1a7b9b] dark:text-[#60c7e3]" />
        Group info
      </h4>

      {isAdmin ? (
        <div className="mb-5 flex flex-col gap-3">
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name"
            className={`w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition-all duration-200 ${EASE} placeholder-gray-400 focus:border-[#1a7b9b]/55 focus:ring-4 focus:ring-[#1a7b9b]/12 dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:placeholder-stone-500`}
          />
          <input
            type="text"
            value={groupImage}
            onChange={(e) => setGroupImage(e.target.value)}
            placeholder="Group image URL (optional)"
            className={`w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition-all duration-200 ${EASE} placeholder-gray-400 focus:border-[#1a7b9b]/55 focus:ring-4 focus:ring-[#1a7b9b]/12 dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:placeholder-stone-500`}
          />
          <button
            onClick={handleSaveDetails}
            disabled={savingDetails}
            className={`flex w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#1f88aa] via-[#1a7b9b] to-[#17708d] py-2.5 text-sm font-medium text-white transition-all duration-200 ${EASE} hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50`}
          >
            {savingDetails ? "Saving..." : "Save details"}
          </button>
        </div>
      ) : (
        <p className="mb-5 text-sm font-medium text-gray-800 dark:text-white/90">{activeChat.name}</p>
      )}

      <h5 className="mb-2 text-xs font-medium uppercase text-gray-500 dark:text-stone-400">
        {members.length} member{members.length === 1 ? "" : "s"}
      </h5>
      <ul className="mb-5 flex max-h-48 flex-col gap-1 overflow-y-auto">
        {members.map((member) => {
          const isThisAdmin = !!activeChat.adminIds?.includes(member.id);
          const isSelf = member.id === currentUser?.id;
          const isChangingRole = roleChangingId === member.id;

          return (
            <li key={member.id} className="flex items-center gap-3 rounded-xl p-2">
              <Image
                src={member.image || "/images/user/user-01.jpg"}
                alt={member.displayName}
                width={36}
                height={36}
                className="rounded-full object-cover"
              />
              <span className="flex-1 truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                {member.displayName} {isSelf && <span className="text-gray-400 dark:text-stone-500">(you)</span>}
              </span>
              {isThisAdmin && (
                <span className="flex items-center gap-1 rounded-full bg-warning-400/15 px-2 py-0.5 text-[11px] font-medium text-warning-600 dark:text-warning-400">
                  <Crown size={12} /> Admin
                </span>
              )}
              {isAdmin && !isSelf && (
                <span className="flex shrink-0 items-center gap-1">
                  {isThisAdmin ? (
                    <button
                      onClick={() => handleDemote(member)}
                      disabled={isChangingRole}
                      aria-label={`Remove admin from ${member.displayName}`}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-warning-600 transition-colors hover:bg-warning-400/10 disabled:opacity-50 dark:text-warning-400"
                    >
                      <ShieldMinus size={15} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePromote(member)}
                      disabled={isChangingRole}
                      aria-label={`Make ${member.displayName} an admin`}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[#1a7b9b] transition-colors hover:bg-[#1a7b9b]/10 disabled:opacity-50 dark:text-[#60c7e3]"
                    >
                      <ShieldPlus size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => handleRemove(member)}
                    disabled={removingId === member.id}
                    aria-label={`Remove ${member.displayName}`}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-error-500 transition-colors hover:bg-error-500/10 disabled:opacity-50"
                  >
                    <UserMinus size={15} />
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {isAdmin && (
        <>
          <h5 className="mb-2 text-xs font-medium uppercase text-gray-500 dark:text-stone-400">
            Add participants
          </h5>
          <div className="relative mb-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people to invite..."
              className={`w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 outline-none transition-all duration-200 ${EASE} placeholder-gray-400 focus:border-[#1a7b9b]/55 focus:ring-4 focus:ring-[#1a7b9b]/12 dark:border-stone-700 dark:bg-stone-800 dark:text-white dark:placeholder-stone-500`}
            />
            <Search size={16} className="absolute left-3 top-3 text-gray-400 dark:text-stone-500" />
          </div>

          {query.trim().length >= 2 && (
            <div className="max-h-40 overflow-y-auto">
              {searching ? (
                <p className="py-4 text-center text-sm text-gray-500 dark:text-stone-400">Searching...</p>
              ) : availableResults.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500 dark:text-stone-400">No users found.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {availableResults.map((user) => (
                    <li key={user.id}>
                      <button
                        onClick={() => handleInvite(user)}
                        disabled={invitingId === user.id}
                        className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors duration-150 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-white/5"
                      >
                        <Image
                          src={user.image || "/images/user/user-01.jpg"}
                          alt={user.displayName}
                          width={36}
                          height={36}
                          className="rounded-full object-cover"
                        />
                        <span className="flex-1 truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                          {user.displayName}
                        </span>
                        <UserPlus size={16} className="text-[#1a7b9b] dark:text-[#60c7e3]" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      <div className="mt-5 border-t border-dashed border-gray-200 pt-4 dark:border-stone-700">
        <button
          onClick={handleLeave}
          disabled={leaving}
          className={`flex w-full items-center justify-center gap-2 rounded-xl bg-error-500/10 py-2.5 text-sm font-medium text-error-600 transition-colors duration-150 hover:bg-error-500/20 disabled:opacity-50 dark:text-error-400 dark:hover:bg-error-500/15`}
        >
          <LogOut size={16} />
          {leaving ? "Leaving..." : "Leave group"}
        </button>
      </div>
    </Modal>
  );
}
