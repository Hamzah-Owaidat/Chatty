export interface User {
  id: string;
  userName: string;
  displayName?: string;
  email?: string;
  image?: string;
  bio?: string;
  backgroundImage?: string;
  // ISO 8601 timestamp of the last display name change. Undefined/null means it has
  // never been changed and is free to update immediately (see utils/time#getDisplayNameCooldown).
  displayNameUpdatedAt?: string;
  // New address awaiting confirmation (PATCH /user/me/email). `email` stays the
  // login/notification address until the link sent here is clicked.
  pendingEmail?: string | null;
  notificationPreferences?: NotificationPreferences;
  lastSeenVisibility?: LastSeenVisibility;
  // Reciprocal: while off, others don't see your reads and you don't see theirs.
  readReceiptsEnabled?: boolean;
  // add other fields as needed
}

// Read-only view of another user's profile (Contact Info modal, avatar hover-card).
// Deliberately separate from the minimal ChatParticipant/ChatUser shapes used by chat
// list payloads — fetched on demand via GET /user/{id}, never stored in Redux.
export interface UserProfile {
  id: string;
  userName: string;
  displayName: string;
  image?: string;
  backgroundImage?: string;
  bio?: string;
  status?: 'online' | 'offline';
  // Only meaningful when status is "offline".
  lastSeenAt?: string;
}

// Which events raise a notification (bell dot today). All default to true server-side.
export interface NotificationPreferences {
  notifyOnMessage: boolean;
  notifyOnChatRequest: boolean;
  notifyOnGroupInvite: boolean;
}

// Who can see your online status and last seen. "contacts" = the hand-picked list below,
// not everyone you chat with.
export type LastSeenVisibility = 'everyone' | 'contacts' | 'nobody';

export interface LastSeenPrivacy {
  value: LastSeenVisibility;
  contacts: { id: string; displayName: string; image?: string }[];
}
