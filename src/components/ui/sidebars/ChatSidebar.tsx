"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useSidebar } from "../../../context/SidebarContext";
import { Search, Plus } from "lucide-react";
import { useChat } from "@/context/ChatContext";
import { getUserChats } from "@/lib/api/chat";
import { UserChat } from "@/types/chat/chat.models";
import { getErrorMessage } from "@/utils/error";
import { showToast } from "@/utils/toast";
import { useAppSelector } from "@/store/hooks";

interface ChatUserDisplay {
  id: string;
  name: string;
  avatar: string;
  status: "online" | "offline" | "away";
  lastMessage: string;
  lastTime: string;
  unread: number;
}

const ChatSidebar = () => {
  const { isExpanded, isMobileOpen, isHovered, toggleMobileSidebar } = useSidebar();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("messages");
  const [chats, setChats] = useState<ChatUserDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const { setActiveUserId, setActiveUserName } = useChat();
  const currentUser = useAppSelector((state) => state.auth.user);

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
        
        // Transform API response to match component's expected format
        const transformedChats: ChatUserDisplay[] = userChats.map((entry: UserChat) => {
          const chatCore = entry.chat;

          // Determine display name
          let name: string;
          if (chatCore.isGroupChat) {
            // Group chat: use group name
            name = chatCore.groupName || `Group ${chatCore.id.slice(-6)}`;
          } else {
            // Direct chat: use receiver info from new API
            if (entry.receiver?.displayName) {
              name = entry.receiver.displayName;
            } else {
              name = "Direct Chat";
            }
          }

          // Avatar: only use URL if provided; otherwise we'll show initials
          const avatar = entry.receiver?.image ?? "";

          const lastMsg = chatCore.lastMessage;
          const lastMsgAt = chatCore.lastMessageAt;

          return {
            id: entry.chatId || chatCore.id,
            name,
            avatar,
            status: "offline", // real presence will come later from backend
            lastMessage: ensureStringMessage(lastMsg),
            lastTime:
              lastMsgAt && lastMsgAt !== "0001-01-01T00:00:00Z"
                ? formatTime(lastMsgAt)
                : formatTime(chatCore.createdAt),
            unread: entry.unreadMessagesCount || 0,
          };
        });
        
        setChats(transformedChats);
      } catch (err) {
        console.error("Error fetching chats:", err);
        showToast.error(getErrorMessage(err));
        setChats([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []); 

  const handleUserClick = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setActiveUserId(userId); // notify parent
    setActiveUserName(userName);
    // On small screens, close the sidebar after opening a chat
    if (isMobileOpen) {
      toggleMobileSidebar();
    }
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

  const renderUserItem = (user: ChatUserDisplay) => (
    <li key={user.id} className="mb-2">
      <button
        onClick={() => handleUserClick(user.id, user.name)}
        className={`flex items-center w-full p-3 rounded-xl transition hover:bg-gray-200 dark:hover:bg-stone-700 group relative ${
          selectedUserId === user.id
            ? "bg-blue-50 dark:bg-blue-900/20 shadow-sm border border-blue-200 dark:border-blue-800"
            : ""
        }`}
      >
        <div className="relative">
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt={user.name}
              width={48}
              height={48}
              className={`rounded-full object-cover border-2 ${
                user.status === "online"
                  ? "border-green-400"
                  : user.status === "away"
                    ? "border-amber-400"
                    : "border-gray-300 dark:border-gray-600"
              }`}
            />
          ) : (
            <div
              className={`w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold border-2 ${
                user.status === "online"
                  ? "border-green-400"
                  : user.status === "away"
                    ? "border-amber-400"
                    : "border-gray-300 dark:border-gray-600"
              }`}
            >
              {user.name?.trim().slice(0, 2).toUpperCase() || "U"}
            </div>
          )}

          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${
              user.status === "online"
                ? "bg-green-400"
                : user.status === "away"
                  ? "bg-amber-400"
                  : "bg-gray-400"
            }`}
          />
        </div>
        
        {(isExpanded || isHovered || isMobileOpen) && (
          <div className="ml-3 flex-1 overflow-hidden">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                {user.name}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {user.lastTime}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-32">
                {user.lastMessage}
              </p>
              {user.unread > 0 && (
                <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center pulse-animation">
                  {user.unread}
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Mini badge for collapsed state */}
        {!(isExpanded || isHovered || isMobileOpen) && user.unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center pulse-animation">
            {user.unread}
          </span>
        )}
      </button>
    </li>
  );

  return (
    <>
      <div className="px-4 mb-4">
        {(isExpanded || isHovered || isMobileOpen) && (
          <div className="relative">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-stone-800 placeholder-gray-400 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          </div>
        )}
      </div>

      {(isExpanded || isHovered || isMobileOpen) && (
        <div className="flex justify-center mb-4 bg-gray-50 dark:bg-stone-800 mx-4 rounded-xl p-1">
          <button
            onClick={() => setActiveTab("messages")}
            className={`flex-1 py-2 px-4 text-sm rounded-lg transition ${
              activeTab === "messages"
                ? "bg-gray-100 dark:bg-stone-700 shadow-sm font-medium text-blue-500"
                : "text-gray-500"
            }`}
          >
            Messages
          </button>
          <button
            onClick={() => setActiveTab("unread")}
            className={`flex-1 py-2 px-4 text-sm rounded-lg transition ${
              activeTab === "unread"
                ? "bg-gray-100 dark:bg-stone-700 shadow-sm font-medium text-blue-500"
                : "text-gray-500"
            }`}
          >
            Unread
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2 overflow-y-auto px-4 h-[calc(100vh-240px)] mb-16 no-scrollbar">
        {!(isExpanded || isHovered || isMobileOpen) && (
          <div className="flex justify-center mb-6">
            <button className="bg-gray-100 dark:bg-stone-800 p-3 rounded-xl hover:bg-gray-200 dark:hover:bg-stone-700 transition-all">
              <Search size={20} className="text-gray-500" />
            </button>
          </div>
        )}
        
        <div className="flex justify-between items-center mb-2 sticky top-0 bg-gray-100 dark:bg-stone-900 py-2 z-10">
          <h2 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
            {isExpanded || isHovered || isMobileOpen ? "Recent Chats" : ""}
          </h2>
          {(isExpanded || isHovered || isMobileOpen) && (
            <button className="text-blue-500 hover:text-blue-600 transition">
              <Plus size={18} />
            </button>
          )}
        </div>

        <ul className="flex flex-col pb-4">
          {loading ? (
            <li className="text-center text-gray-500 dark:text-gray-400 py-8">
              Loading chats...
            </li>
          ) : filteredUsers.length === 0 ? (
            <li className="text-center text-gray-500 dark:text-gray-400 py-8">
              No chats found
            </li>
          ) : (
            filteredUsers.map(renderUserItem)
          )}
        </ul>
      </div>
    </>
  );
};

export default ChatSidebar;