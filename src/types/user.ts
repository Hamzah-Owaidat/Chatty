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