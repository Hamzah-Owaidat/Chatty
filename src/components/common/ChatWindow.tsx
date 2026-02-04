"use client";
import React, { useState, useEffect, useRef } from "react";
import { Send, Paperclip, Mic, Image, FileText, Camera, Check, CheckCheck, Phone, EllipsisVertical, Info, Trash2, XCircle, Search } from "lucide-react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useSignalR } from "@/hooks/useSignalR";
import { getMessages } from "@/lib/api/message";
import { ChatMessage } from "@/types/chat/chat.models";
import { useAppSelector } from "@/store/hooks";
import { getErrorMessage } from "@/utils/error";
import { showToast } from "@/utils/toast";

interface ChatWindowProps {
  chatId: string;
  chatName?: string | null;
}

export default function ChatWindow({ chatId, chatName }: ChatWindowProps) {
  const [message, setMessage] = useState("");
  const [showAttachments, setShowAttachments] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = useAppSelector((state) => state.auth.user);

  // Use SignalR hook for real-time messaging
  const { messages, setMessages, sendMessage: sendSignalRMessage, isConnected, addMessage } = useSignalR(chatId);

  // Helper to ensure content is always a string
  const ensureStringContent = (content: any): string => {
    if (typeof content === 'string') {
      return content;
    }
    if (content === null || content === undefined) {
      return '';
    }
    if (typeof content === 'object') {
      // If it's an object, try to extract a meaningful string
      if (content.text) return String(content.text);
      if (content.message) return String(content.message);
      // Otherwise, stringify it
      return JSON.stringify(content);
    }
    return String(content);
  };

  // Fetch existing messages when chatId changes
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const fetchedMessages = await getMessages(chatId);
        // Transform messages to match our format
        const transformedMessages: ChatMessage[] = fetchedMessages.map((msg: any) => {
          // Extract nested properties and flatten
          const transformed: ChatMessage = {
            id: String(msg.id || ''),
            content: ensureStringContent(msg.content),
            senderId: String(msg.senderId || msg.sender?.id || ''),
            chatId: String(msg.chatId || msg.chat?.id || chatId),
            timestamp: msg.sentAt || msg.createdAt || msg.timestamp || new Date().toISOString(),
            sentAt: msg.sentAt,
            createdAt: msg.createdAt,
            isRead: msg.isRead,
            status: msg.status,
            // Keep nested objects for future use
            sender: msg.sender,
            chat: msg.chat,
          };
          return transformed;
        });
        setMessages(transformedMessages);
      } catch (err) {
        console.error("Error fetching messages:", err);
        showToast.error(getErrorMessage(err));
      }
    };

    if (chatId) {
      fetchMessages();
    }
  }, [chatId, setMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const MessageStatus = ({ status }: { status?: string }) => {
    if (status === "sent") return <Check className="w-4 h-4 text-gray-400" />;
    if (status === "delivered") return <CheckCheck className="w-4 h-4 text-gray-400" />;
    if (status === "seen") return <CheckCheck className="w-4 h-4 text-green-500" />;
    return null;
  };

  const handleSendMessage = async () => {
    if (!message.trim() || sending) return;

    const messageContent = message.trim();
    console.log('📤 Sending message:', {
      chatId,
      content: messageContent,
      senderId: currentUser?.id,
      timestamp: new Date().toISOString()
    });
    
    setMessage("");
    setSending(true);

    // Optimistically add message to UI
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      senderId: currentUser?.id || "",
      chatId: chatId,
      sentAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      status: "sent",
    };
    console.log('➕ Adding optimistic message to UI:', tempMessage);
    addMessage(tempMessage);

    try {
      console.log('📡 Calling SignalR hub SendMessage...');
      // Send via SignalR hub (which will save + broadcast to all clients)
      await sendSignalRMessage(messageContent, currentUser?.id);
      console.log(
        '✅ Message sent successfully via SignalR hub; waiting for broadcast to update UI.'
      );
    } catch (err) {
      console.error('❌ Error sending message via SignalR hub:', err);
      showToast.error(getErrorMessage(err));
      // Remove failed message
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp?: string): string => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return timestamp;
    }
  };

  const attachmentOptions = [
    { icon: Camera, label: "Camera", color: "text-green-600" },
    { icon: Image, label: "Photo & Video", color: "text-blue-600" },
    { icon: FileText, label: "Document", color: "text-purple-600" },
  ];

  // Get display name for the chat (coming from ChatContext via props)
  const chatDisplayName = chatName || "Chat";

  return (
    <div className="flex flex-col h-[80vh] rounded-lg">
      {/* Chat header */}
      <div className="relative">
        <div className="p-3 border-b dark:border-stone-700 flex justify-between items-center bg-gray-100 dark:bg-stone-800 rounded-t-lg">
          {/* Left side (user info) */}
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
              {chatDisplayName?.charAt(0) || "C"}
            </div>
            <div>
              <span className="font-semibold text-gray-800 dark:text-gray-100 block">
                {chatDisplayName}
              </span>
              <span className={`text-sm ${isConnected ? "text-green-500" : "text-gray-400"}`}>
                {isConnected ? "Online" : "Connecting..."}
              </span>
            </div>
          </div>

          {/* Right side (actions) */}
          <div className="flex items-center space-x-4">
            <div className="bg-transparent hover:bg-[#1a7b9b] border border-gray-300 text-stone-700 hover:text-white hover:border-none dark:text-white dark:border-stone-700 cursor-pointer rounded-full p-3 h-11 w-11 flex items-center justify-center shadow-md transition-transform duration-200 hover:scale-110 hover:shadow-lg">
              <Phone size={20} />
            </div>

            {/* Ellipsis with dropdown */}
            <div className="relative">
              <EllipsisVertical
                size={20}
                className="cursor-pointer dropdown-toggle bg-transparent hover:bg-gray-100 dark:hover:bg-stone-700 text-stone-700 hover:text-white hover:border-none dark:text-white rounded-full p-2 h-10 w-10 flex items-center justify-center transition-transform duration-200"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
              />

              <Dropdown isOpen={isDropdownOpen} onClose={() => setIsDropdownOpen(false)}>
                <div className="flex flex-col gap-2 w-[180px] rounded-lg border border-gray-200 bg-white shadow-theme-lg dark:border-stone-800 dark:bg-stone-950">
                  <DropdownItem className="flex items-center justify-arround px-4 py-2 font-medium text-gray-700 rounded-t-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300">
                    <Info className="w-4 h-4 mr-2 text-blue-500" />
                    Contact Info
                  </DropdownItem>
                  <DropdownItem className="flex items-center justify-arround px-4 py-2 font-medium text-gray-700 group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300 border-b border-gray-200 dark:border-gray-800">
                    <Search className="w-4 h-4 mr-2 text-green-500" />
                    Search Messages
                  </DropdownItem>
                  <DropdownItem className="flex items-center justify-arround px-4 py-2 font-medium text-gray-700 group text-theme-sm hover:text-gray-700 dark:text-gray-400 hover:bg-red-500/15 dark:hover:text-gray-300">
                    <XCircle className="w-4 h-4 mr-2 text-yellow-500" />
                    Clear Chat
                  </DropdownItem>
                  <DropdownItem className="flex items-center justify-arround px-4 py-2 font-medium text-gray-700 rounded-b-lg group text-theme-sm hover:bg-red-500/15 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                    <Trash2 className="w-4 h-4 mr-2 text-red-500" />
                    Delete Chat
                  </DropdownItem>
                </div>
              </Dropdown>
            </div>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-stone-900 rounded-b-lg chat-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId === currentUser?.id;
            return (
              <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div className={`flex items-end space-x-2 max-w-[70%] ${isOwn ? "flex-row-reverse space-x-reverse" : "flex-row"}`}>
                  {!isOwn && (
                    <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-semibold mb-1">
                      {chatDisplayName?.charAt(0) || "U"}
                    </div>
                  )}

                  <div className="relative group">
                    <div
                      className={`px-2 py-1 rounded-2xl border-2 ${
                        isOwn
                          ? "bg-[#1a7b9b]/80 text-white border-blue-400 rounded-br-md"
                          : "bg-white dark:bg-stone-800 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-stone-600 rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{ensureStringContent(msg.content)}</p>
                      <div className="flex items-center justify-end mt-1 space-x-1">
                        <span className={`text-[11px] ${isOwn ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}>
                          {formatTime(msg.sentAt || msg.timestamp || msg.createdAt)}
                        </span>
                        {isOwn && <MessageStatus status={msg.status} />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input + Attachments */}
      <div className="sticky bottom-0 mt-3 px-3 py-2 bg-gray-100 dark:bg-stone-800 rounded-full">
        {/* Floating attachment menu */}
        {showAttachments && (
          <div className="absolute bottom-14 left-3 z-20 bg-white dark:bg-stone-800 rounded-xl shadow-lg border dark:border-stone-600 w-fit">
            <div className="flex flex-col p-2">
              {attachmentOptions.map((option, index) => (
                <button
                  key={index}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-stone-700 transition"
                  onClick={() => setShowAttachments(false)}
                >
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full ${option.color} bg-opacity-10`}>
                    <option.icon className={`w-5 h-5 ${option.color}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat input row */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setShowAttachments(!showAttachments)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-stone-700 rounded-full transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={sending || !isConnected}
            className="flex-1 rounded-full px-4 py-2 bg-white dark:bg-stone-700 focus:outline-none text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50"
          />

          <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-stone-700 rounded-full transition-colors">
            <Mic className="w-5 h-5" />
          </button>

          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || sending || !isConnected}
            className="bg-[#1a7b9b] hover:bg-[#1a7b9b]/80 text-white p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
