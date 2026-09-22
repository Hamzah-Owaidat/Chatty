export interface ChatUser {
  id: string;
  userName: string;
  displayName?: string;
  email?: string;
  image?: string;
  status?: 'online' | 'offline' | 'away';
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
}

// Backend's UserDto — the other chat member(s), already filtered to exclude the caller
export interface ChatParticipant {
  id: string;
  displayName: string;
  image: string;
}

export interface ChatSummary {
  id: string;
  isGroupChat: boolean;
  groupName?: string | null;
  participantsIds: string[];
  adminId?: string | null;
  createdAt: string;
  lastMessageAt: string;
  lastMessage?: ChatMessage | null;
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

// POST /api/chat body — group chats only; 1:1 chats come from an accepted ChatRequest
export interface ChatCreateDto {
  isGroupChat: boolean;
  groupName: string;
  participantsIds: string[];
  adminId: string;
}

// GET /api/chat-requests/incoming|outgoing, POST /api/chat-requests/{id}/accept response data
export interface ChatRequestDto {
  id: string;
  sender: ChatParticipant;
  receiver: ChatParticipant;
  createdAt: string;
}
