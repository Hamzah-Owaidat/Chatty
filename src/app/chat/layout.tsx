"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import ChatSidebar from "@/layout/ChatSidebar";
import Backdrop from "@/layout/Backdrop";
import React, { useState } from "react";
import ChatWindow from "@/components/common/ChatWindow";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop */}
      <ChatSidebar onUserSelect={setActiveUserId}/>
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          {activeUserId ? (
            <ChatWindow userId={activeUserId} />
          ) : (
            <div className="text-center text-gray-500 mt-20">
              👋 Select a user to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
