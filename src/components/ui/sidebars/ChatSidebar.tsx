"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HubConnection } from "@microsoft/signalr";
import { useSidebar } from "../../../context/SidebarContext";
import { Search, Plus, MessageSquarePlus, UsersRound, Link2 } from "lucide-react";
import { useChat } from "@/context/ChatContext";
import { getUserChats } from "@/lib/api/chat";
import { UserChat, ChatParticipant, ParticipantRemovedDto } from "@/types/chat/chat.models";
import { getErrorMessage } from "@/utils/error";
import { showToast } from "@/utils/toast";
import { useAppSelector } from "@/store/hooks";
import { startSignalRConnection } from "@/lib/signalr/signalr";
import { usePresence } from "@/hooks/usePresence";
import { useChatActivity } from "@/hooks/useChatActivity";
import { getActivityLabel } from "@/utils/chatActivity";
import { formatRelativeTime } from "@/utils/time";
import { describeAttachments } from "@/utils/file";
import { useNow } from "@/hooks/useNow";
import { Dropdown } from "../dropdown/Dropdown";
import { DropdownItem } from "../dropdown/DropdownItem";
import { useModal } from "@/hooks/useModal";
import NewChatModal from "@/components/common/NewChatModal";
import NewGroupModal from "@/components/common/NewGroupModal";
import InviteLinkModal from "@/components/common/InviteLinkModal";
import UserAvatar from "@/components/common/UserAvatar";

interface ChatUserDisplay {
  id: string;
  name: string;
  avatar: string;
  status: "online" | "offline" | "away";
  lastMessage: string;
  // Raw timestamp — formatted to "2m ago" etc. at render time (see resolveLastTime),
  // so it keeps ticking forward instead of freezing at whatever it read on fetch.
  lastTimeRaw?: string;
  unread: number;
  isGroupChat: boolean;
  groupImage?: string | null;
  adminIds?: string[];
  participants: ChatParticipant[];
}

const EASE = "ease-[cubic-bezier(.2,.8,.2,1)]";

const ChatSidebar = () => {
  const { isExpanded, isMobileOpen, isHovered } = useSidebar();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("messages");
  const [chats, setChats] = useState<ChatUserDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const { activeChat, setActiveUserId, setActiveChat, chatListVersion } = useChat();
  const currentUser = useAppSelector((state) => state.auth.user);
  const router = useRouter();
  const searchParams = useSearchParams();
  const newChatModal = useModal();
  const newGroupModal = useModal();
  const inviteLinkModal = useModal();
  const presence = usePresence();
  const chatActivity = useChatActivity();
  // Ticks a re-render every 30s so "just now" / "16m ago" stay live without a refresh.
  useNow(30000);

  // Read inside the mount-once ParticipantRemoved listener below without making it re-attach.
  const currentUserIdRef = useRef<string | undefined>(currentUser?.id);
  const activeChatIdRef = useRef<string | undefined>(activeChat?.id);
  useEffect(() => {
    currentUserIdRef.current = currentUser?.id;
  }, [currentUser?.id]);
  useEffect(() => {
    activeChatIdRef.current = activeChat?.id;
  }, [activeChat?.id]);

  const showFull = isExpanded || isHovered || isMobileOpen;

  // Helper to ensure lastMessage is always a string
  const ensureStringMessage = (message: any): string => {
    if (typeof message === 'string') {
      return message;
    }
    if (message === null || message === undefined) {
      return '';
    }
    if (typeof message === 'object') {
      // If it's a message object, extract the content
      if (message.content) return String(message.content);
      // Attachment-only message (e.g. just a photo) — describe what was sent
      if (Array.isArray(message.attachments) && message.attachments.length > 0) {
        return describeAttachments(message.attachments);
      }
      if ('content' in message) return '';
      if (message.text) return String(message.text);
      if (message.message) return String(message.message);
      // Otherwise, stringify it
      return JSON.stringify(message);
    }
    return String(message);
  };

  // Transform a backend UserChatStateDto (REST list item or ChatStateUpdated payload)
  // into the shape this component renders.
  const transformChat = (chat: UserChat): ChatUserDisplay => {
    const chatInfo = chat.chat;
    let name: string;
    let avatar = "";

    const otherParticipant = chat.participants?.[0];

    if (chatInfo?.isGroupChat) {
      // Group chat: use group name (and image, if one was set)
      name = chatInfo.groupName || `Group ${chatInfo.id.slice(-6)}`;
      avatar = chatInfo.groupImage || avatar;
    } else if (otherParticipant) {
      // Direct chat: use the other participant's info
      name = otherParticipant.displayName || "Unknown User";
      avatar = otherParticipant.image || avatar;
    } else {
      name = "Direct Chat";
    }

    return {
      id: chat.chatId,
      name: name,
      avatar: avatar,
      // Group chats have no single "other user" to show a status for — direct
      // chats use the fetched baseline; live updates are overlaid at render time.
      status: !chatInfo?.isGroupChat ? otherParticipant?.status || "offline" : "offline",
      lastMessage: ensureStringMessage(chatInfo?.lastMessage),
      lastTimeRaw: chatInfo?.lastMessageAt && chatInfo.lastMessageAt !== "0001-01-01T00:00:00Z"
        ? chatInfo.lastMessageAt
        : (chatInfo?.createdAt || chat.joinedAt),
      unread: chat.unreadMessagesCount || 0,
      isGroupChat: !!chatInfo?.isGroupChat,
      groupImage: chatInfo?.groupImage,
      adminIds: chatInfo?.adminIds,
      participants: chat.participants || [],
    };
  };

  // Fetch user chats from API
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        const userChats = await getUserChats();

        // Ensure userChats is an array
        if (!Array.isArray(userChats)) {
          console.error("API did not return an array:", userChats);
          setChats([]);
          return;
        }

        const transformed = userChats.map(transformChat);
        setChats(transformed);

        // Landed here from an invite-link accept (or any other "open this chat" deep
        // link) — auto-select it once the list has loaded, then drop the param so a
        // later refresh doesn't keep re-selecting it.
        const targetChatId = searchParams.get("chatId");
        if (targetChatId) {
          const target = transformed.find((c) => c.id === targetChatId);
          if (target) {
            handleUserClick(target);
          }
          router.replace("/chat");
        }
      } catch (err) {
        console.error("Error fetching chats:", err);
        showToast.error(getErrorMessage(err));
        setChats([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
    // transformChat/handleUserClick/searchParams/router are stable enough here —
    // refetch only when asked to (chatListVersion bumps after creating/accepting a
    // chat elsewhere in the tree).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatListVersion]);

  // Live unread badges: the initial GET only reflects the moment the sidebar mounted.
  // Every send/read after that pushes a ChatStateUpdated for this user on the shared
  // hub connection — patch the matching row in place instead of ever refetching.
  useEffect(() => {
    let isMounted = true;
    let conn: HubConnection | null = null;
    let handleChatStateUpdated: ((dto: UserChat) => void) | null = null;
    let handleParticipantRemoved: ((dto: ParticipantRemovedDto) => void) | null = null;

    const attach = async () => {
      try {
        conn = await startSignalRConnection();
        if (!isMounted) return;

        handleChatStateUpdated = (dto: UserChat) => {
          setChats((prev) => {
            const transformed = transformChat(dto);
            // A new message (or a read) just touched this chat — bring it to the top,
            // same as the backend's own most-recently-active ordering, instead of
            // patching it in place where it could stay scrolled out of view.
            const rest = prev.filter((c) => c.id !== dto.chatId);
            return [transformed, ...rest];
          });
        };

        // When someone else is removed the remaining participants get a fresh
        // ChatStateUpdated (handled above); the removed user doesn't, so drop the
        // chat from our own list only when we were the one removed.
        handleParticipantRemoved = (dto: ParticipantRemovedDto) => {
          if (dto.userId !== currentUserIdRef.current) return;
          setChats((prev) => prev.filter((c) => c.id !== dto.chatId));
          if (activeChatIdRef.current === dto.chatId) {
            setActiveChat(null);
            setActiveUserId(null);
            setSelectedUserId(null);
          }
        };

        conn.on("ChatStateUpdated", handleChatStateUpdated);
        conn.on("ParticipantRemoved", handleParticipantRemoved);
      } catch (err) {
        console.error("Failed to attach ChatStateUpdated listener:", err);
      }
    };

    attach();

    return () => {
      isMounted = false;
      // Only detach our own listeners — the connection is a shared singleton that
      // ChatWindow may still be using, so it isn't ours to stop here.
      if (conn && handleChatStateUpdated) {
        conn.off("ChatStateUpdated", handleChatStateUpdated);
      }
      if (conn && handleParticipantRemoved) {
        conn.off("ParticipantRemoved", handleParticipantRemoved);
      }
    };
    // transformChat is a pure render-scoped helper (no closures over changing state);
    // this effect intentionally attaches once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Overlays a live UserStatusChanged update (keyed by the other participant's
  // userId) on top of the status fetched when the sidebar loaded.
  const resolveStatus = (user: ChatUserDisplay): ChatUserDisplay["status"] => {
    const otherId = !user.isGroupChat ? user.participants?.[0]?.id : undefined;
    return (otherId && presence[otherId]?.status) || user.status;
  };

  const handleUserClick = (user: ChatUserDisplay) => {
    setSelectedUserId(user.id);
    setActiveUserId(user.id); // notify parent
    setActiveChat({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      status: resolveStatus(user),
      isGroupChat: user.isGroupChat,
      groupImage: user.groupImage,
      adminIds: user.adminIds,
      participants: user.participants,
    });
  };

  const filteredUsers = chats.filter(user =>
    user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Animation effect for new messages
  useEffect(() => {
    const interval = setInterval(() => {
      const pulseElements = document.querySelectorAll('.pulse-animation');
      pulseElements.forEach(el => {
        el.classList.add('animate-pulse');
        setTimeout(() => {
          el.classList.remove('animate-pulse');
        }, 1000);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const statusRingClass = (status: ChatUserDisplay["status"]) =>
    status === "online"
      ? "shadow-[0_0_0_2px_#fff,0_0_0_4px_rgba(18,183,106,.35)] dark:shadow-[0_0_0_2px_#201d1b,0_0_0_4px_rgba(50,213,131,.35)]"
      : "shadow-[0_0_0_2px_#fff,0_0_0_4px_rgba(152,162,179,.35)] dark:shadow-[0_0_0_2px_#201d1b,0_0_0_4px_rgba(138,130,125,.35)]";

  const statusDotClass = (status: ChatUserDisplay["status"]) =>
    status === "online" ? "bg-success-500 dark:bg-success-400" : status === "away" ? "bg-warning-400" : "bg-gray-400 dark:bg-stone-500";

  const renderUserItem = (user: ChatUserDisplay, index: number) => {
    const status = resolveStatus(user);
    const rowActivity = chatActivity[user.id];
    const lastTime = formatRelativeTime(user.lastTimeRaw);

    return (
    <li key={user.id} className="mb-1.5">
      <button
        onClick={() => handleUserClick(user)}
        style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
        className={`animate-[floatIn_.22s_cubic-bezier(.2,.8,.2,1)_both] relative flex w-full items-center rounded-2xl p-3 text-left transition-all duration-200 ${EASE} ${
          selectedUserId === user.id
            ? "bg-gradient-to-r from-[#1a7b9b]/[0.09] to-transparent border border-[#1a7b9b]/25 dark:from-[#2596bb]/[0.16] dark:border-[#2596bb]/30"
            : "border border-transparent hover:-translate-y-px hover:bg-gray-100/80 hover:shadow-[0_10px_20px_-18px_rgba(16,24,40,.6)] dark:hover:bg-white/[0.04]"
        }`}
      >
        {selectedUserId === user.id && (
          <span className="absolute left-0 inset-y-3.5 w-[3px] rounded-r bg-[#1a7b9b] dark:bg-[#2596bb] dark:shadow-[0_0_8px_rgba(37,150,187,.6)]" />
        )}

        <div className="relative shrink-0">
          <UserAvatar
            src={user.avatar}
            name={user.name}
            size={48}
            className={`rounded-full ${user.isGroupChat ? "" : statusRingClass(status)}`}
          />
          {/* Groups have no single peer to be "online" — the presence dot only makes
              sense for a direct chat. */}
          {!user.isGroupChat && (
            <span className="absolute bottom-0 right-0 flex h-3 w-3">
              {status === "online" && (
                <span className="absolute inset-0 rounded-full bg-success-500 animate-ring" />
              )}
              <span className={`relative h-3 w-3 rounded-full border-2 border-white dark:border-[#201d1b] ${statusDotClass(status)}`} />
            </span>
          )}
        </div>

        {showFull && (
          <div className="ml-3 flex-1 overflow-hidden">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                {user.name}
              </span>
              <span className="shrink-0 text-[11px] text-gray-500 dark:text-stone-400">
                {lastTime}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p
                className={`max-w-[9rem] truncate text-xs ${
                  rowActivity ? "italic text-[#1a7b9b] dark:text-[#60c7e3]" : "text-gray-500 dark:text-stone-400"
                }`}
              >
                {rowActivity
                  ? getActivityLabel(
                      rowActivity.activityType,
                      user.isGroupChat
                        ? user.participants.find((p) => p.id === rowActivity.userId)?.displayName
                        : undefined
                    )
                  : user.lastMessage}
              </p>
              {user.unread > 0 && (
                <span className="animate-badge-glow flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1a7b9b] px-1.5 text-[11px] font-semibold text-white dark:bg-[#2596bb]">
                  {user.unread}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Mini badge for collapsed state */}
        {!showFull && user.unread > 0 && (
          <span className="animate-badge-glow absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1a7b9b] px-1 text-[11px] font-semibold text-white dark:bg-[#2596bb]">
            {user.unread}
          </span>
        )}
      </button>
    </li>
    );
  };

  const renderSkeletonRow = (key: number) => (
    <li key={key} className="mb-1.5 flex items-center gap-3 p-3">
      <span className="h-12 w-12 shrink-0 animate-shimmer rounded-full bg-gray-200 dark:bg-stone-800" />
      {showFull && (
        <div className="flex-1 space-y-2">
          <span className="block h-3 w-3/4 animate-shimmer rounded-full bg-gray-200 dark:bg-stone-800" />
          <span className="block h-2.5 w-1/2 animate-shimmer rounded-full bg-gray-200 dark:bg-stone-800" />
        </div>
      )}
    </li>
  );

  return (
    <>
      <div className="sticky top-0 z-10 -mt-2 border-b border-gray-200/70 bg-gray-100/80 px-4 pb-3 pt-2 backdrop-blur-md backdrop-saturate-150 dark:border-stone-800/70 dark:bg-stone-900/80">
        {showFull && (
          <div className="relative">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full rounded-xl bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 shadow-[inset_0_1px_2px_rgba(16,24,40,.06)] outline-none transition-all duration-200 ${EASE} placeholder-gray-400 focus:-translate-y-px focus:border-[#1a7b9b]/55 focus:ring-4 focus:ring-[#1a7b9b]/12 dark:bg-stone-800 dark:text-white dark:placeholder-stone-500 dark:shadow-[inset_0_1px_2px_rgba(0,0,0,.3)] border border-gray-200 dark:border-stone-700`}
            />
            <Search size={16} className="absolute left-3 top-3 text-gray-400 dark:text-stone-500" />
          </div>
        )}

        {showFull && (
          <div className="mt-3 flex justify-center rounded-xl bg-gray-200/60 p-1 shadow-[inset_0_1px_2px_rgba(16,24,40,.08)] dark:bg-stone-950/40">
            <button
              onClick={() => setActiveTab("messages")}
              className={`flex-1 rounded-lg py-1.5 px-4 text-sm transition-all duration-200 ${EASE} active:scale-[.97] ${
                activeTab === "messages"
                  ? "bg-white font-medium text-[#1a7b9b] shadow-[0_2px_6px_rgba(16,24,40,.12)] dark:bg-stone-700 dark:text-[#60c7e3]"
                  : "text-gray-500 hover:text-gray-700 dark:text-stone-400 dark:hover:text-stone-200"
              }`}
            >
              Messages
            </button>
            <button
              onClick={() => setActiveTab("unread")}
              className={`flex-1 rounded-lg py-1.5 px-4 text-sm transition-all duration-200 ${EASE} active:scale-[.97] ${
                activeTab === "unread"
                  ? "bg-white font-medium text-[#1a7b9b] shadow-[0_2px_6px_rgba(16,24,40,.12)] dark:bg-stone-700 dark:text-[#60c7e3]"
                  : "text-gray-500 hover:text-gray-700 dark:text-stone-400 dark:hover:text-stone-200"
              }`}
            >
              Unread
            </button>
          </div>
        )}
      </div>

      <div className="chat-scrollbar fade-y flex h-[calc(100vh-280px)] flex-col gap-2 overflow-y-auto px-4 pb-16 pt-3">
        {!showFull && (
          <div className="mb-4 flex justify-center">
            <button className={`rounded-xl bg-gray-100 p-3 transition-all duration-200 ${EASE} hover:-translate-y-0.5 hover:bg-[#1a7b9b] hover:text-white hover:shadow-[0_8px_16px_-8px_rgba(26,123,155,.6)] dark:bg-stone-800 dark:hover:bg-[#2596bb]`}>
              <Search size={20} className="text-gray-500 dark:text-stone-400" />
            </button>
          </div>
        )}

        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase text-gray-500 dark:text-stone-400">
            {showFull ? "Recent Chats" : ""}
          </h2>
          {showFull && (
            <div className="relative">
              <button
                onClick={() => setIsAddMenuOpen((prev) => !prev)}
                aria-label="New chat options"
                className={`dropdown-toggle flex h-7 w-7 items-center justify-center rounded-full text-[#1a7b9b] transition-all duration-200 ${EASE} hover:rotate-90 hover:bg-[#1a7b9b]/10 dark:text-[#60c7e3] dark:hover:bg-[#2596bb]/15`}
              >
                <Plus size={18} />
              </button>

              <Dropdown
                isOpen={isAddMenuOpen}
                onClose={() => setIsAddMenuOpen(false)}
                className={`w-[208px] origin-top-right animate-[floatIn_.18s_cubic-bezier(.2,.8,.2,1)_both] rounded-2xl border border-gray-200/70 bg-white/90 p-1.5 shadow-[0_1px_2px_rgba(16,24,40,.04),0_20px_40px_-20px_rgba(16,24,40,.5)] backdrop-blur-md backdrop-saturate-150 dark:border-stone-800/70 dark:bg-stone-900/90`}
              >
                <DropdownItem
                  onItemClick={() => {
                    setIsAddMenuOpen(false);
                    newChatModal.openModal();
                  }}
                  baseClassName={`flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-theme-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-[#1a7b9b]/10 hover:text-[#1a7b9b] dark:text-stone-300 dark:hover:bg-[#2596bb]/15 dark:hover:text-[#60c7e3]`}
                >
                  <MessageSquarePlus size={16} className="text-[#1a7b9b] dark:text-[#60c7e3]" />
                  New chat
                </DropdownItem>
                <DropdownItem
                  onItemClick={() => {
                    setIsAddMenuOpen(false);
                    newGroupModal.openModal();
                  }}
                  baseClassName={`flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-theme-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-[#1a7b9b]/10 hover:text-[#1a7b9b] dark:text-stone-300 dark:hover:bg-[#2596bb]/15 dark:hover:text-[#60c7e3]`}
                >
                  <UsersRound size={16} className="text-[#1a7b9b] dark:text-[#60c7e3]" />
                  New group
                </DropdownItem>
                <DropdownItem
                  onItemClick={() => {
                    setIsAddMenuOpen(false);
                    inviteLinkModal.openModal();
                  }}
                  baseClassName={`flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-theme-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-[#1a7b9b]/10 hover:text-[#1a7b9b] dark:text-stone-300 dark:hover:bg-[#2596bb]/15 dark:hover:text-[#60c7e3]`}
                >
                  <Link2 size={16} className="text-[#1a7b9b] dark:text-[#60c7e3]" />
                  Invite via link
                </DropdownItem>
              </Dropdown>
            </div>
          )}
        </div>

        <ul className="flex flex-col pb-4">
          {loading ? (
            [0, 1, 2].map(renderSkeletonRow)
          ) : filteredUsers.length === 0 ? (
            <li className="py-8 text-center text-sm text-gray-500 dark:text-stone-400">
              No chats found
            </li>
          ) : (
            filteredUsers.map((user, index) => renderUserItem(user, index))
          )}
        </ul>
      </div>

      <NewChatModal isOpen={newChatModal.isOpen} onClose={newChatModal.closeModal} />
      <NewGroupModal isOpen={newGroupModal.isOpen} onClose={newGroupModal.closeModal} />
      <InviteLinkModal isOpen={inviteLinkModal.isOpen} onClose={inviteLinkModal.closeModal} />
    </>
  );
};

export default ChatSidebar;
