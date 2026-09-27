"use client";
import { useEffect, useRef, useState } from "react";
import { HubConnection } from "@microsoft/signalr";
import { startSignalRConnection } from "@/lib/signalr/signalr";
import { ChatActivityType, UserActivityDto } from "@/types/chat/chat.models";

const ACTIVITY_TIMEOUT_MS = 3000;

export type ChatActivityEntry = { userId: string; activityType: ChatActivityType };

// Live "someone is doing X in this chat" state per chatId, fed by the backend's
// "UserActivity" broadcast (typing today; the same event covers future activity
// types like recording a voice note — see getActivityLabel). An entry self-expires
// a few seconds after the last event for that chat, since the sender only re-sends
// while actively typing rather than announcing when they stop.
export const useChatActivity = () => {
  const [activity, setActivity] = useState<Record<string, ChatActivityEntry>>({});
  const timeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    let isMounted = true;
    let conn: HubConnection | null = null;
    let handleUserActivity: ((dto: UserActivityDto) => void) | null = null;
    const timeouts = timeoutsRef.current;

    const attach = async () => {
      try {
        conn = await startSignalRConnection();
        if (!isMounted) return;

        handleUserActivity = (dto: UserActivityDto) => {
          setActivity((prev) => ({
            ...prev,
            [dto.chatId]: { userId: dto.userId, activityType: dto.activityType },
          }));

          if (timeouts[dto.chatId]) {
            clearTimeout(timeouts[dto.chatId]);
          }
          timeouts[dto.chatId] = setTimeout(() => {
            setActivity((prev) => {
              const { [dto.chatId]: _removed, ...rest } = prev;
              return rest;
            });
            delete timeouts[dto.chatId];
          }, ACTIVITY_TIMEOUT_MS);
        };

        conn.on("UserActivity", handleUserActivity);
      } catch (err) {
        console.error("Failed to attach UserActivity listener:", err);
      }
    };

    attach();

    return () => {
      isMounted = false;
      if (conn && handleUserActivity) {
        conn.off("UserActivity", handleUserActivity);
      }
      Object.values(timeouts).forEach(clearTimeout);
    };
  }, []);

  return activity;
};
