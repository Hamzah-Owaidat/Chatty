export interface ChatUser {
  id: string;
  userName: string;
  displayName?: string;
  email?: string;
  image?: string;
  status?: 'online' | 'offline' | 'away';
}

// Mirrors the backend's MessageType enum (numeric, no JsonStringEnumConverter registered).
export enum BackendMessageType {
  Message = 1,
  Alert = 2,
}

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  receiverId?: string;
  chatId?: string;
  timestamp?: string;
  sentAt?: string;
  createdAt?: string;
  isRead?: boolean;
  status?: 'sent' | 'seen' | 'failed';
  // Alert messages are system events (e.g. "X has joined the chat") rendered as a
  // centered pill instead of a normal sender bubble.
  type?: BackendMessageType;
  // Nested objects from API
  sender?: {
    id: string;
    userName: string;
    displayName?: string;
    image?: string;
  };
  chat?: {
    id: string;
    isGroupChat: boolean;
    groupName?: string;
  };
}

export interface SendMessageRequest {
  content: string;
}

// SignalR "MessagesUpdated" payload / POST .../message/read response
export interface MessageUpdatedDto {
  chatId: string;
  userId: string;
  lastReadMessageId: string;
  lastReadAt: string;
  // Ids of messages that just became fully read (every participant, not just
  // whoever triggered this event) — the only correct signal to flip a sender's own
  // bubble to "seen" in a group chat.
  readMessageIds: string[];
}

// Backend's UserDto — the other chat member(s), already filtered to exclude the caller
export interface ChatParticipant {
  id: string;
  displayName: string;
  image: string;
  status?: 'online' | 'offline';
  // Only meaningful when status is "offline" — when the user's last connection dropped.
  lastSeenAt?: string;
}

// SignalR "UserStatusChanged" payload
export interface UserStatusChangedDto {
  userId: string;
  status: 'online' | 'offline';
  lastSeenAt?: string;
}

// Known values for UserActivityDto.activityType — open-ended so new ephemeral
// "user is doing X in this chat" signals (e.g. recording a voice note) can be
// added later without a contract change.
export type ChatActivityType = 'typing' | (string & {});

// SignalR "UserActivity" payload
export interface UserActivityDto {
  chatId: string;
  userId: string;
  activityType: ChatActivityType;
}

export interface ChatSummary {
  id: string;
  isGroupChat: boolean;
  groupName?: string | null;
  groupImage?: string | null;
  participantsIds: string[];
  adminId?: string | null;
  createdAt: string;
  lastMessageAt: string;
  lastMessage?: ChatMessage | null;
}

// SignalR "ParticipantAdded" payload
export interface ParticipantAddedDto {
  chatId: string;
  participant: ChatParticipant;
}

// SignalR "ParticipantRemoved" payload
export interface ParticipantRemovedDto {
  chatId: string;
  userId: string;
}

// SignalR "ChatUpdated" payload (also the PATCH /api/chat/{chatId} response shape's source)
export interface ChatDetailsUpdatedDto {
  chatId: string;
  groupName?: string | null;
  groupImage?: string | null;
}

// PATCH /api/chat/{chatId} body — only non-null fields are applied
export interface UpdateChatDetailsDto {
  groupName?: string;
  groupImage?: string;
}

// Generic wrapper for the backend's Result<T>/Result<IEnumerable<T>> envelope
export interface ApiEnvelope<T> {
  isSuccess: boolean;
  statusCode: number;
  error: any;
  data: T;
}

// Mirrors the backend's UserChatStateDto (GET /chat/user-chats)
export interface UserChat {
  chatId: string;
  userId: string;
  lastReadMessageId?: string | null;
  unreadMessagesCount: number;
  lastReadAt: string;
  isMuted: boolean;
  role: number;
  joinedAt: string;
  lastUpdatedAt: string;
  participants?: ChatParticipant[];
  chat?: ChatSummary | null;
  status?: 'online' | 'offline' | 'away';
}

export interface ApiChatResponse {
  isSuccess: boolean;
  statusCode: number;
  error: any;
  data: UserChat[];
}

// Backend's ChatInviteInfoDto — a personal, reusable "invite via link" shareable
// with anyone; safe to show to an unauthenticated visitor before they sign in.
export interface ChatInviteInfo {
  token: string;
  senderId: string;
  senderDisplayName: string;
  senderImage?: string;
}

// Backend's Chat model — returned by POST /chat-invites/{token}/accept.
export interface AcceptedInviteChat {
  id: string;
  isGroupChat: boolean;
  participantsIds: string[];
}

// POST /api/chat body — group chats only; 1:1 chats come from an accepted ChatRequest.
// Only the caller becomes an immediate member/admin — everyone else listed here gets
// sent a chat request (group invite) instead of being added directly.
export interface ChatCreateDto {
  isGroupChat: boolean;
  groupName: string;
  groupImage?: string;
  participantsIds: string[];
  adminId: string;
}

// GET /api/chat-requests/incoming|outgoing, POST /api/chat-requests/{id}/accept response data.
// Unified for both a direct chat request and a group chat invite — chatId/chatName/chatImage
// are only set for the latter (Sender is that chat's admin in that case).
export interface ChatRequestDto {
  id: string;
  sender: ChatParticipant;
  receiver: ChatParticipant;
  chatId?: string | null;
  chatName?: string | null;
  chatImage?: string | null;
  createdAt: string;
}
