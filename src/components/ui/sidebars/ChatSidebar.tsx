"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useSidebar } from "../../../context/SidebarContext";
import { Search, Plus } from "lucide-react";
import { useChat } from "@/context/ChatContext";

// Enhanced fake user data with online status, unread counts and last message
const fakeUsers = [
  {
    id: "u1",
    name: "Alice Johnson",
    avatar: "/images/user/user-01.jpg",
    status: "online",
    lastMessage: "Hey, are you available for a call?",
    lastTime: "2m ago",
    unread: 3,
  },
  {
    id: "u2",
    name: "Bob Smith",
    avatar: "/images/user/user-02.jpg",
    status: "online",
    lastMessage: "I've sent you the latest designs",
    lastTime: "10m ago",
    unread: 1,
  },
  {
    id: "u3",
    name: "Charlie Brown",
    avatar: "/images/user/user-03.jpg",
    status: "offline",
    lastMessage: "Thanks for your help yesterday!",
    lastTime: "2d ago",
    unread: 0,
  },
  {
    id: "u4",
    name: "Dana White",
    avatar: "/images/user/user-04.jpg",
    status: "away",
    lastMessage: "Let's schedule that meeting",
    lastTime: "4h ago",
    unread: 0,
  },
  ,
  {
    id: "u5",
    name: "Dana White",
    avatar: "/images/user/user-04.jpg",
    status: "online",
    lastMessage: "Let's schedule that meeting",
    lastTime: "4h ago",
    unread: 0,
  },
  {
    id: "u6",
    name: "Dana White",
    avatar: "/images/user/user-04.jpg",
    status: "away",
    lastMessage: "Let's schedule that meeting",
    lastTime: "4h ago",
    unread: 0,
  },
  {
    id: "u7",
    name: "Dana White",
    avatar: "/images/user/user-04.jpg",
    status: "away",
    lastMessage: "Let's schedule that meeting",
    lastTime: "4h ago",
    unread: 0,
  },
  {
    id: "u8",
    name: "Dana White",
    avatar: "/images/user/user-04.jpg",
    status: "online",
    lastMessage: "Let's schedule that meeting",
    lastTime: "4h ago",
    unread: 0,
  },
  {
    id: "u9",
    name: "Dana White",
    avatar: "/images/user/user-04.jpg",
    status: "offline",
    lastMessage: "Let's schedule that meeting",
    lastTime: "4h ago",
    unread: 0,
  },
];

const ChatSidebar = () => {
  const { isExpanded, isMobileOpen, isHovered } = useSidebar();
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("messages");
  const { setActiveUserId } = useChat(); 

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setActiveUserId(userId); // notify parent
  };

  const filteredUsers = fakeUsers.filter(user =>
    user?.name.toLowerCase().includes(searchTerm.toLowerCase())
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

  const renderUserItem = (user) => (
    <li key={user.id} className="mb-2">
      <button
        onClick={() => handleUserClick(user.id)}
        className={`flex items-center w-full p-3 rounded-xl transition hover:bg-gray-200 dark:hover:bg-stone-700 group relative ${
          selectedUserId === user.id
            ? "bg-blue-50 dark:bg-blue-900/20 shadow-sm border border-blue-200 dark:border-blue-800"
            : ""
        }`}
      >
        <div className="relative">
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
          {filteredUsers.map(renderUserItem)}
        </ul>
      </div>
    </>
  );
};

export default ChatSidebar;