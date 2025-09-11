// app/chat/layout.tsx
"use client";

import React from "react";
import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import Backdrop from "@/layout/Backdrop";
import { ChatProvider } from "@/context/ChatContext";
import { AppTabProvider } from "@/context/AppTabContext";
import AppSidebar from "@/layout/AppSidebar";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  return (
    <AppTabProvider>
      <ChatProvider>
        <div className="min-h-screen xl:flex">
          {/* Sidebar */}
          <AppSidebar />

          {/* Main content */}
          <div
            className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
          >
            <AppHeader />
            <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
              {children}
            </div>
          </div>

          {/* Optional backdrop (if you use it for mobile) */}
          <Backdrop />
        </div>
      </ChatProvider>
    </AppTabProvider>
  );
}
