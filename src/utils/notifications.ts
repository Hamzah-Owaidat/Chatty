import { ChatRequestDto } from "@/types/chat/chat.models";
import { NotificationPreferences } from "@/types/user";

// Mirrors the backend default for users who have never changed these settings.
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  notifyOnMessage: true,
  notifyOnChatRequest: true,
  notifyOnGroupInvite: true,
};

// A request with a chatId is a group invite; one without is a direct chat request.
export function shouldNotifyForRequest(request: ChatRequestDto, preferences?: NotificationPreferences): boolean {
  const prefs = preferences ?? DEFAULT_NOTIFICATION_PREFERENCES;
  return request.chatId ? prefs.notifyOnGroupInvite : prefs.notifyOnChatRequest;
}
