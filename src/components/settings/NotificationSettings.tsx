"use client";
import React from "react";
import Toggle from "@/components/common/Toggle";
import { updateNotificationPreferences } from "@/lib/api/settings";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCredentials } from "@/store/slices/authSlice";
import { NotificationPreferences } from "@/types/user";
import { getErrorMessage } from "@/utils/error";
import { showToast } from "@/utils/toast";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/utils/notifications";
import { SettingRow } from "./shared";

const ROWS: { key: keyof NotificationPreferences; title: string; description: string }[] = [
    { key: "notifyOnMessage", title: "New messages", description: "Get alerted about new messages in your chats." },
    { key: "notifyOnChatRequest", title: "Chat requests", description: "Show the bell dot when someone wants to start a chat." },
    { key: "notifyOnGroupInvite", title: "Group invites", description: "Show the bell dot when I'm invited to a group." },
];

export default function NotificationSettings() {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const preferences = user?.notificationPreferences ?? DEFAULT_NOTIFICATION_PREFERENCES;

    // Optimistic: flip it in the store right away, roll back if the server refuses.
    const setPreference = async (key: keyof NotificationPreferences, value: boolean) => {
        if (!user) return;

        dispatch(setCredentials({ user: { ...user, notificationPreferences: { ...preferences, [key]: value } } }));

        try {
            const saved = await updateNotificationPreferences({ [key]: value });
            dispatch(setCredentials({ user: { ...user, notificationPreferences: saved } }));
        } catch (err) {
            dispatch(setCredentials({ user: { ...user, notificationPreferences: preferences } }));
            showToast.error(getErrorMessage(err));
        }
    };

    return (
        <div className="space-y-3">
            {ROWS.map((row) => (
                <SettingRow
                    key={row.key}
                    title={row.title}
                    description={row.description}
                    control={
                        <Toggle
                            checked={preferences[row.key]}
                            onChange={(value) => setPreference(row.key, value)}
                            label={row.title}
                        />
                    }
                />
            ))}
        </div>
    );
}
