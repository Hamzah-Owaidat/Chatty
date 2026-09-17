"use client";
import React, { useState, useEffect, useRef } from "react";
import { Send, Paperclip, Mic, Image, FileText, Camera, Check, CheckCheck, Phone, EllipsisVertical, Info, Trash2, XCircle, Search, Smile, ChevronDown } from "lucide-react";
import EmojiPicker, { EmojiClickData, Theme as EmojiTheme } from "emoji-picker-react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useSignalR } from "@/hooks/useSignalR";
import { getMessages } from "@/lib/api/message";
import { ChatMessage } from "@/types/chat/chat.models";
import { useAppSelector } from "@/store/hooks";
import { getErrorMessage } from "@/utils/error";
import { showToast } from "@/utils/toast";
import { useTheme } from "@/context/ThemeContext";

interface ChatWindowProps {
  chatId: string;
}

const EASE = "ease-[cubic-bezier(.2,.8,.2,1)]";

export default function ChatWindow({ chatId }: ChatWindowProps) {
  const [message, setMessage] = useState("");
  const [showAttachments, setShowAttachments] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unseenCount, setUnseenCount] = useState(0);
  // Reserved for a future "peer is typing" SignalR event — presentational only, never set today.
  const [isPeerTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const currentUser = useAppSelector((state) => state.auth.user);
  const { theme } = useTheme();

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
        // Ensure oldest-to-newest order regardless of API ordering
        transformedMessages.sort(
          (a, b) =>
            new Date(a.sentAt || a.createdAt || a.timestamp || 0).getTime() -
            new Date(b.sentAt || b.createdAt || b.timestamp || 0).getTime()
        );
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

  // Track unseen message count while the user has scrolled up from the bottom
  useEffect(() => {
    const prevCount = lastMessageCountRef.current;
    if (messages.length > prevCount && !isAtBottom) {
      setUnseenCount((c) => c + (messages.length - prevCount));
    }
    lastMessageCountRef.current = messages.length;
  }, [messages, isAtBottom]);

  const handleMessageListScroll = () => {
    const el = messageListRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distanceFromBottom < 120;
    setIsAtBottom(atBottom);
    if (atBottom) setUnseenCount(0);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setUnseenCount(0);
  };

  // Close emoji picker when clicking outside of it
  useEffect(() => {
    if (!showEmojiPicker) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  // Typing anywhere on the page (outside another input/textarea) jumps focus to the
  // message box and starts typing there, instead of requiring a click first.
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (sending || !isConnected) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length !== 1) return; // letters, digits, symbols, space

      const target = e.target as HTMLElement | null;
      const isAlreadyEditable =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (isAlreadyEditable) return;

      e.preventDefault();
      setMessage((prev) => prev + e.key);
      messageInputRef.current?.focus();
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [sending, isConnected]);

  const MessageStatus = ({ status }: { status?: string }) => {
    if (status === "sent") return <Check className="w-4 h-4 text-gray-400" />;
    if (status === "delivered") return <CheckCheck className="w-4 h-4 text-gray-400" />;
    if (status === "seen") return <CheckCheck className="w-4 h-4 text-success-400" />;
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

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage((prev) => prev + emojiData.emoji);
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
    { icon: Camera, label: "Camera", color: "text-success-500" },
    { icon: Image, label: "Photo & Video", color: "text-[#1a7b9b] dark:text-[#60c7e3]" },
    { icon: FileText, label: "Document", color: "text-theme-purple-500" },
  ];

  // Get display name for the chat (this would ideally come from the chat context or props)
  const chatDisplayName = "Chat"; // TODO: Get from chat context or props

  const bubbleRadius = (isOwn: boolean, isFirstInGroup: boolean) => {
    if (isOwn) {
      return isFirstInGroup ? "18px 18px 6px 18px" : "18px 6px 6px 18px";
    }
    return isFirstInGroup ? "18px 18px 18px 6px" : "6px 18px 18px 6px";
  };

  const dropdownItemClass =
    "flex items-center gap-2.5 rounded-[10px] px-3 py-2 font-medium text-gray-700 text-theme-sm transition-colors duration-150 hover:bg-[#1a7b9b]/10 hover:text-[#1a7b9b] dark:text-stone-300 dark:hover:bg-[#2596bb]/15 dark:hover:text-[#60c7e3]";

  return (
    <div className="flex h-[80vh] flex-col overflow-hidden rounded-3xl border border-gray-200/70 bg-white shadow-[0_1px_2px_rgba(16,24,40,.04),0_28px_60px_-46px_rgba(16,24,40,.7)] dark:border-stone-800/70 dark:bg-[#201d1b]">
      {/* Chat header */}
      <div className="relative z-20 flex items-center justify-between border-b border-gray-200/70 bg-white/75 px-4 py-3 backdrop-blur-xl backdrop-saturate-150 dark:border-stone-800/70 dark:bg-[#201d1b]/75">
        {/* Left side (user info) */}
        <div className="flex items-center">
          <div className="relative mr-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#1f88aa] via-[#1a7b9b] to-[#17708d] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.25),0_8px_16px_-10px_rgba(26,123,155,.65)]">
              {chatDisplayName?.charAt(0) || "C"}
            </div>
            {isConnected && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                <span className="absolute inset-0 rounded-full bg-success-500 animate-ring" />
                <span className="relative h-3.5 w-3.5 rounded-full border-2 border-white bg-success-500 dark:border-[#201d1b] dark:bg-success-400" />
              </span>
            )}
          </div>
          <div>
            <span className="block font-semibold text-gray-800 dark:text-gray-100">
              {chatDisplayName}
            </span>
            <span className={`text-xs ${isConnected ? "text-success-600 dark:text-success-400" : "text-gray-400 dark:text-stone-500"}`}>
              {isConnected ? "Online" : "Connecting..."}
            </span>
          </div>
        </div>

        {/* Right side (actions) */}
        <div className="flex items-center gap-2">
          <button
            aria-label="Call"
            className={`flex h-10 w-10 items-center justify-center rounded-[13px] border border-gray-200 text-stone-600 transition-all duration-200 ${EASE} hover:-translate-y-0.5 hover:border-transparent hover:bg-[#1a7b9b] hover:text-white hover:shadow-[0_10px_18px_-10px_rgba(26,123,155,.7)] active:scale-95 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-[#2596bb]`}
          >
            <Phone size={18} />
          </button>

          {/* Ellipsis with dropdown */}
          <div className="relative">
            <button
              aria-label="More options"
              className={`dropdown-toggle flex h-10 w-10 items-center justify-center rounded-[13px] border border-gray-200 text-stone-600 transition-all duration-200 ${EASE} hover:-translate-y-0.5 hover:border-transparent hover:bg-[#1a7b9b] hover:text-white hover:shadow-[0_10px_18px_-10px_rgba(26,123,155,.7)] active:scale-95 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-[#2596bb]`}
              onClick={() => setIsDropdownOpen((prev) => !prev)}
            >
              <EllipsisVertical size={18} />
            </button>

            <Dropdown
              isOpen={isDropdownOpen}
              onClose={() => setIsDropdownOpen(false)}
              className={`flex w-[208px] origin-top-right animate-[floatIn_.18s_cubic-bezier(.2,.8,.2,1)_both] flex-col gap-0.5 rounded-2xl border border-gray-200/70 bg-white/90 p-1.5 shadow-[0_1px_2px_rgba(16,24,40,.04),0_20px_40px_-20px_rgba(16,24,40,.5)] backdrop-blur-md backdrop-saturate-150 dark:border-stone-800/70 dark:bg-stone-900/90`}
            >
              <DropdownItem onItemClick={() => setIsDropdownOpen(false)} baseClassName={dropdownItemClass}>
                <Info className="h-4 w-4 text-[#1a7b9b] dark:text-[#60c7e3]" />
                Contact Info
              </DropdownItem>
              <DropdownItem onItemClick={() => setIsDropdownOpen(false)} baseClassName={dropdownItemClass}>
                <Search className="h-4 w-4 text-[#1a7b9b] dark:text-[#60c7e3]" />
                Search Messages
              </DropdownItem>
              <DropdownItem onItemClick={() => setIsDropdownOpen(false)} baseClassName={dropdownItemClass}>
                <XCircle className="h-4 w-4 text-[#1a7b9b] dark:text-[#60c7e3]" />
                Clear Chat
              </DropdownItem>
              <div className="my-1 border-t border-dashed border-gray-200 dark:border-stone-700" />
              <DropdownItem
                onItemClick={() => setIsDropdownOpen(false)}
                baseClassName="flex items-center gap-2.5 rounded-[10px] px-3 py-2 font-medium text-error-600 text-theme-sm transition-colors duration-150 hover:bg-error-500/10 dark:text-error-400 dark:hover:bg-error-500/15"
              >
                <Trash2 className="h-4 w-4" />
                Delete Chat
              </DropdownItem>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="relative flex-1 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-64"
          style={{ background: "radial-gradient(1200px 400px at 50% -10%, rgba(26,123,155,.05), transparent 70%)" }}
        />
        <div
          ref={messageListRef}
          onScroll={handleMessageListScroll}
          className="chat-scrollbar fade-y relative h-full overflow-y-auto p-4 dark:bg-[#1c1917]"
        >
          {messages.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500 dark:text-stone-400">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <>
              <div className="mb-4 flex justify-center">
                <span className="rounded-full bg-gray-100/80 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-gray-500 backdrop-blur-sm dark:bg-stone-800/70 dark:text-stone-400">
                  Today
                </span>
              </div>

              {messages.map((msg, index) => {
                const isOwn = msg.senderId === currentUser?.id;
                const isFirstInGroup = index === 0 || messages[index - 1].senderId !== msg.senderId;

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"} ${isFirstInGroup ? "mt-3" : "mt-1"}`}
                  >
                    <div className={`flex items-end gap-2 max-w-[70%] ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                      {!isOwn && (
                        <div className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-400 text-xs font-semibold text-white dark:bg-stone-600">
                          {chatDisplayName?.charAt(0) || "U"}
                        </div>
                      )}

                      <div className="group relative">
                        <div
                          style={{
                            borderRadius: bubbleRadius(isOwn, isFirstInGroup),
                            animationDelay: `${Math.min(index, 8) * 40}ms`,
                          }}
                          className={`animate-[bubbleIn_.34s_cubic-bezier(.2,.8,.2,1)_both] px-3 py-2 transition-transform duration-200 ${EASE} hover:-translate-y-px ${
                            isOwn
                              ? "bg-gradient-to-br from-[#1f88aa] via-[#1a7b9b] to-[#17708d] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.25),0_1px_2px_rgba(16,24,40,.04),0_14px_26px_-18px_rgba(26,123,155,.6)]"
                              : "border border-gray-200/70 bg-white text-gray-800 shadow-[0_1px_2px_rgba(16,24,40,.04),0_14px_26px_-18px_rgba(16,24,40,.35)] dark:border-stone-700/70 dark:bg-[#292524] dark:text-gray-100"
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{ensureStringContent(msg.content)}</p>
                          <div className="mt-1 flex items-center justify-end gap-1">
                            <span className={`text-[11px] ${isOwn ? "text-white/75" : "text-gray-500 dark:text-stone-400"}`}>
                              {formatTime(msg.sentAt || msg.timestamp || msg.createdAt)}
                            </span>
                            {isOwn && <MessageStatus status={msg.status} />}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {isPeerTyping && (
                <div className="mt-1 flex justify-start">
                  <div className="flex items-end gap-2">
                    <div className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-400 text-xs font-semibold text-white dark:bg-stone-600">
                      {chatDisplayName?.charAt(0) || "U"}
                    </div>
                    <div className="flex items-center gap-1 rounded-[18px_18px_18px_6px] border border-gray-200/70 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(16,24,40,.04),0_14px_26px_-18px_rgba(16,24,40,.35)] dark:border-stone-700/70 dark:bg-[#292524]">
                      <span className="animate-typing-dot h-1.5 w-1.5 rounded-full bg-[#1a7b9b] dark:bg-[#60c7e3]" style={{ animationDelay: "0s" }} />
                      <span className="animate-typing-dot h-1.5 w-1.5 rounded-full bg-[#1a7b9b] dark:bg-[#60c7e3]" style={{ animationDelay: "0.16s" }} />
                      <span className="animate-typing-dot h-1.5 w-1.5 rounded-full bg-[#1a7b9b] dark:bg-[#60c7e3]" style={{ animationDelay: "0.32s" }} />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {!isAtBottom && unseenCount > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <button
              onClick={scrollToBottom}
              className={`pointer-events-auto flex animate-[floatIn_.2s_cubic-bezier(.2,.8,.2,1)_both] items-center gap-1.5 rounded-full border border-gray-200/70 bg-white/85 px-3.5 py-1.5 text-xs font-medium text-gray-700 shadow-[0_10px_24px_-12px_rgba(16,24,40,.5)] backdrop-blur-md transition-all duration-200 ${EASE} hover:-translate-y-0.5 dark:border-stone-700/70 dark:bg-stone-800/85 dark:text-gray-100`}
            >
              <ChevronDown size={14} className="text-[#1a7b9b] dark:text-[#60c7e3]" />
              {unseenCount} new message{unseenCount > 1 ? "s" : ""}
            </button>
          </div>
        )}
      </div>

      {/* Input + Attachments */}
      <div className="relative z-20 border-t border-gray-200/70 bg-white/75 px-3 py-3 backdrop-blur-xl backdrop-saturate-150 dark:border-stone-800/70 dark:bg-[#201d1b]/75">
        {/* Floating attachment menu */}
        {showAttachments && (
          <div className="absolute bottom-full left-3 z-20 mb-2 w-fit animate-[floatIn_.18s_cubic-bezier(.2,.8,.2,1)_both] rounded-2xl border border-gray-200/70 bg-white/90 shadow-[0_1px_2px_rgba(16,24,40,.04),0_20px_40px_-20px_rgba(16,24,40,.5)] backdrop-blur-md dark:border-stone-700/70 dark:bg-stone-900/90">
            <div className="flex flex-col p-1.5">
              {attachmentOptions.map((option, index) => (
                <button
                  key={index}
                  className={`flex items-center gap-3 rounded-[10px] px-3 py-2 text-left transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-stone-700`}
                  onClick={() => setShowAttachments(false)}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 ${option.color}`}>
                    <option.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat input row */}
        <div
          className={`flex items-center gap-1 rounded-full bg-white px-2 py-1.5 shadow-[inset_0_1px_2px_rgba(16,24,40,.06)] transition-shadow duration-200 ${EASE} focus-within:ring-4 focus-within:ring-[#1a7b9b]/10 dark:bg-[#292524] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,.35)]`}
        >
          <button
            onClick={() => setShowAttachments(!showAttachments)}
            aria-label="Attach file"
            className={`flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-all duration-200 ${EASE} hover:-rotate-12 hover:bg-[#1a7b9b]/10 hover:text-[#1a7b9b] dark:text-stone-400 dark:hover:bg-[#2596bb]/15 dark:hover:text-[#60c7e3]`}
          >
            <Paperclip className="h-5 w-5" />
          </button>

          <div className="relative" ref={emojiPickerRef}>
            <button
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              aria-label="Choose emoji"
              className={`flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-all duration-200 ${EASE} hover:scale-[1.12] hover:bg-[#1a7b9b]/10 hover:text-[#1a7b9b] dark:text-stone-400 dark:hover:bg-[#2596bb]/15 dark:hover:text-[#60c7e3]`}
            >
              <Smile className="h-5 w-5" />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 z-40 mb-2">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  theme={theme === "dark" ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                  lazyLoadEmojis
                />
              </div>
            )}
          </div>

          <input
            ref={messageInputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={sending || !isConnected}
            className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none disabled:opacity-50 dark:text-white dark:placeholder-stone-500"
          />

          <span className="mr-1 hidden shrink-0 items-center rounded-full bg-gray-100 px-2 py-1 text-[11px] text-gray-400 sm:inline-flex dark:bg-white/5 dark:text-stone-500">
            Enter ↵
          </span>

          <button
            aria-label="Voice message"
            className={`flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-all duration-200 ${EASE} hover:bg-[#1a7b9b]/10 hover:text-[#1a7b9b] dark:text-stone-400 dark:hover:bg-[#2596bb]/15 dark:hover:text-[#60c7e3]`}
          >
            <Mic className="h-5 w-5" />
          </button>

          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || sending || !isConnected}
            aria-label="Send message"
            className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1f88aa] via-[#1a7b9b] to-[#17708d] text-white shadow-[0_10px_18px_-10px_rgba(26,123,155,.75)] transition-all duration-200 ${EASE} hover:-translate-y-0.5 hover:scale-[1.04] active:scale-[.94] disabled:pointer-events-none disabled:opacity-40`}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
