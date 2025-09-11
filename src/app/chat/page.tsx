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
        <ChatWindow userId={activeUserId} />
      ) : (
        <div className="text-center text-gray-500 mt-20">
          👋 Select a user to start chatting
        </div>
      )}
    </>
  );
}
