"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { HubConnection } from "@microsoft/signalr";
import { useSidebar } from "../../../context/SidebarContext";
import { Search, Plus, MessageSquarePlus, UsersRound, Link2 } from "lucide-react";
import { useChat } from "@/context/ChatContext";
import { getUserChats } from "@/lib/api/chat";
import { UserChat } from "@/types/chat/chat.models";
import { getErrorMessage } from "@/utils/error";
import { showToast } from "@/utils/toast";
import { useAppSelector } from "@/store/hooks";
import { startSignalRConnection } from "@/lib/signalr/signalr";
import { Dropdown } from "../dropdown/Dropdown";
import { DropdownItem } from "../dropdown/DropdownItem";

interface ChatUserDisplay {
  id: string;
  name: string;
  avatar: string;
  status: "online" | "offline" | "away";
  lastMessage: string;
  lastTime: string;
  unread: number;
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
  const { setActiveUserId } = useChat();
  const currentUser = useAppSelector((state) => state.auth.user);

  const showFull = isExpanded || isHovered || isMobileOpen;

  // Helper function to format time (e.g., "2m ago", "10m ago", "2d ago")
  const formatTime = (timestamp?: string): string => {
    if (!timestamp) return "";

    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return "just now";
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

      return date.toLocaleDateString();
    } catch {
      return timestamp;
    }
  };

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
    let avatar: string = "/images/user/user-01.jpg";

    if (chatInfo?.isGroupChat) {
      // Group chat: use group name
      name = chatInfo.groupName || `Group ${chatInfo.id.slice(-6)}`;
    } else if (chat.receiver) {
      // Direct chat: use the other participant's info
      name = chat.receiver.displayName || "Unknown User";
      avatar = chat.receiver.image || avatar;
    } else {
      name = "Direct Chat";
    }

    return {
      id: chat.chatId,
      name: name,
      avatar: avatar,
      status: chat.status || "offline",
      lastMessage: ensureStringMessage(chatInfo?.lastMessage),
      lastTime: chatInfo?.lastMessageAt && chatInfo.lastMessageAt !== "0001-01-01T00:00:00Z"
        ? formatTime(chatInfo.lastMessageAt)
        : formatTime(chatInfo?.createdAt || chat.joinedAt),
      unread: chat.unreadMessagesCount || 0,
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

        setChats(userChats.map(transformChat));
      } catch (err) {
        console.error("Error fetching chats:", err);
        showToast.error(getErrorMessage(err));
        setChats([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live unread badges: the initial GET only reflects the moment the sidebar mounted.
  // Every send/read after that pushes a ChatStateUpdated for this user on the shared
  // hub connection — patch the matching row in place instead of ever refetching.
  useEffect(() => {
    let isMounted = true;
    let conn: HubConnection | null = null;
    let handleChatStateUpdated: ((dto: UserChat) => void) | null = null;

    const attach = async () => {
      try {
        conn = await startSignalRConnection();
        if (!isMounted) return;

        handleChatStateUpdated = (dto: UserChat) => {
          setChats((prev) => {
            const idx = prev.findIndex((c) => c.id === dto.chatId);
            if (idx === -1) return prev; // not a chat this sidebar already knows about
            const next = [...prev];
            next[idx] = transformChat(dto);
            return next;
          });
        };

        conn.on("ChatStateUpdated", handleChatStateUpdated);
      } catch (err) {
        console.error("Failed to attach ChatStateUpdated listener:", err);
      }
    };

    attach();

    return () => {
      isMounted = false;
      // Only detach our own listener — the connection is a shared singleton that
      // ChatWindow may still be using, so it isn't ours to stop here.
      if (conn && handleChatStateUpdated) {
        conn.off("ChatStateUpdated", handleChatStateUpdated);
      }
    };
    // transformChat is a pure render-scoped helper (no closures over changing state);
    // this effect intentionally attaches once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setActiveUserId(userId); // notify parent
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

  const renderUserItem = (user: ChatUserDisplay, index: number) => (
    <li key={user.id} className="mb-1.5">
      <button
        onClick={() => handleUserClick(user.id)}
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
          <Image
            src={user.avatar}
            alt={user.name}
            width={48}
            height={48}
            className={`rounded-full object-cover ${statusRingClass(user.status)}`}
          />
          <span className="absolute bottom-0 right-0 flex h-3 w-3">
            {user.status === "online" && (
              <span className="absolute inset-0 rounded-full bg-success-500 animate-ring" />
            )}
            <span className={`relative h-3 w-3 rounded-full border-2 border-white dark:border-[#201d1b] ${statusDotClass(user.status)}`} />
          </span>
        </div>

        {showFull && (
          <div className="ml-3 flex-1 overflow-hidden">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                {user.name}
              </span>
              <span className="shrink-0 text-[11px] text-gray-500 dark:text-stone-400">
                {user.lastTime}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="max-w-[9rem] truncate text-xs text-gray-500 dark:text-stone-400">
                {user.lastMessage}
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
                  onItemClick={() => setIsAddMenuOpen(false)}
                  baseClassName={`flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-theme-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-[#1a7b9b]/10 hover:text-[#1a7b9b] dark:text-stone-300 dark:hover:bg-[#2596bb]/15 dark:hover:text-[#60c7e3]`}
                >
                  <MessageSquarePlus size={16} className="text-[#1a7b9b] dark:text-[#60c7e3]" />
                  New chat
                </DropdownItem>
                <DropdownItem
                  onItemClick={() => setIsAddMenuOpen(false)}
                  baseClassName={`flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-theme-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-[#1a7b9b]/10 hover:text-[#1a7b9b] dark:text-stone-300 dark:hover:bg-[#2596bb]/15 dark:hover:text-[#60c7e3]`}
                >
                  <UsersRound size={16} className="text-[#1a7b9b] dark:text-[#60c7e3]" />
                  New group
                </DropdownItem>
                <DropdownItem
                  onItemClick={() => setIsAddMenuOpen(false)}
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
    </>
  );
};

export default ChatSidebar;
