"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { ChatParticipant } from "@/types/chat/chat.models";

// Minimal display info the sidebar already has when a chat is selected —
// carried alongside activeUserId so ChatWindow doesn't have to refetch it.
export type ActiveChatInfo = {
  id: string;
  name: string;
  avatar: string;
  status?: "online" | "offline" | "away";
  isGroupChat?: boolean;
  groupImage?: string | null;
  // Only meaningful for group chats — lets ChatWindow/GroupInfoModal gate
  // admin-only actions (add/remove participants, edit details) client-side.
  adminId?: string | null;
  // Other members (caller excluded) — lets ChatWindow label senders on live
  // SignalR messages, which don't carry a nested sender object.
  participants?: ChatParticipant[];
};

type ChatContextType = {
  activeUserId: string | null;
  setActiveUserId: (id: string | null) => void;
  activeChat: ActiveChatInfo | null;
  // Dispatch (not a plain setter) so callers that merge live updates onto the
  // current chat — e.g. a SignalR handler — can use the functional form and avoid
  // clobbering a concurrent update made from a stale closure.
  setActiveChat: React.Dispatch<React.SetStateAction<ActiveChatInfo | null>>;
  // Bumped whenever a chat is created or a request accepted elsewhere in the
  // tree (e.g. the notification dropdown) — the sidebar refetches on change.
  chatListVersion: number;
  refreshChatList: () => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<ActiveChatInfo | null>(null);
  const [chatListVersion, setChatListVersion] = useState(0);

  const refreshChatList = useCallback(() => setChatListVersion((v) => v + 1), []);

  return (
    <ChatContext.Provider
      value={{ activeUserId, setActiveUserId, activeChat, setActiveChat, chatListVersion, refreshChatList }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return ctx;
};
