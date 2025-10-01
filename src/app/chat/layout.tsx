"use client";

import React, { useEffect, useState } from "react";
import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import Backdrop from "@/layout/Backdrop";
import { ChatProvider } from "@/context/ChatContext";
import { AppTabProvider } from "@/context/AppTabContext";
import AppSidebar from "@/layout/AppSidebar";
import { useAppSelector } from "@/store/hooks";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { token, initialized } = useAppSelector((state) => state.auth);
  const router = useRouter();

  // Track when component mounted (prevents SSR mismatch)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if no token (only after mounted + initialized)
  useEffect(() => {
    if (mounted && initialized && !token) {
      router.push("/auth/signin");
    }
  }, [mounted, initialized, token, router]);

  // Prevent hydration errors → show loader until client is ready
  if (!mounted || !initialized) {
    return (
      <LoadingSpinner size="xl" fullScreen text="Loading your chats..." />
    );
  }

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

          {/* Optional backdrop */}
          <Backdrop />
        </div>
      </ChatProvider>
    </AppTabProvider>
  );
}
