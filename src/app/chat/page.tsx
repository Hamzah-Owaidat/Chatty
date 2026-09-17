// app/chat/page.tsx
"use client"; // page needs to use hooks (useChat)
import React from "react";
import ChatWindow from "@/components/common/ChatWindow";
import { useChat } from "@/context/ChatContext";

export default function ChatPage() {
  const { activeUserId } = useChat();

  return (
    <>
      {activeUserId ? (
        <ChatWindow chatId={activeUserId} />
      ) : (
        <div className="text-center text-gray-500 mt-20">
          👋 Select a chat to start messaging
        </div>
      )}
    </>
  );
}
