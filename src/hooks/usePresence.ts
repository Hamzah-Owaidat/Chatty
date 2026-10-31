"use client";
import { useEffect, useState } from "react";
import { HubConnection } from "@microsoft/signalr";
import { startSignalRConnection } from "@/lib/signalr/signalr";
import { UserStatusChangedDto } from "@/types/chat/chat.models";

export type PresenceEntry = {
  status: "online" | "offline";
  // Only set for "offline" — when that user's last connection dropped.
  lastSeenAt?: string;
};

// Live online/offline status (+ last seen, once offline) per userId, fed by the
// backend's "UserStatusChanged" broadcast. Multiple components can call this — they
// all share the same underlying SignalR connection singleton and just read from this
// map; only the initial fetch (UserChat.participants[].status/lastSeenAt) has a value
// before the first event arrives.
export const usePresence = () => {
  const [statuses, setStatuses] = useState<Record<string, PresenceEntry>>({});

  useEffect(() => {
    let isMounted = true;
    let conn: HubConnection | null = null;
    let handleUserStatusChanged: ((dto: UserStatusChangedDto) => void) | null = null;

    const attach = async () => {
      try {
        conn = await startSignalRConnection();
        if (!isMounted) return;

        handleUserStatusChanged = (dto: UserStatusChangedDto) => {
          setStatuses((prev) => ({
            ...prev,
            [dto.userId]: { status: dto.status, lastSeenAt: dto.lastSeenAt },
          }));
        };

        conn.on("UserStatusChanged", handleUserStatusChanged);
      } catch (err) {
        console.error("Failed to attach UserStatusChanged listener:", err);
      }
    };

    attach();

    return () => {
      isMounted = false;
      // Only detach our own listener — the connection is a shared singleton other
      // hooks/components may still be using, so it isn't ours to stop here.
      if (conn && handleUserStatusChanged) {
        conn.off("UserStatusChanged", handleUserStatusChanged);
      }
    };
  }, []);

  return statuses;
};
