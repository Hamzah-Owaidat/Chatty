"use client";

import React, { createContext, useContext, useState } from "react";

type ChatContextType = {
  activeUserId: string | null;
  setActiveUserId: (id: string | null) => void;
  activeUserName: string | null;
  setActiveUserName: (name: string | null) => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [activeUserName, setActiveUserName] = useState<string | null>(null);

  return (
    <ChatContext.Provider
      value={{ activeUserId, setActiveUserId, activeUserName, setActiveUserName }}
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
