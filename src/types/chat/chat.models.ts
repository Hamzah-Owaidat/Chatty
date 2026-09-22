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

export interface ChatReceiver {
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
  receiver?: ChatReceiver | null;
  chat?: ChatSummary | null;
  status?: 'online' | 'offline' | 'away';
}

export interface ApiChatResponse {
  isSuccess: boolean;
  statusCode: number;
  error: any;
  data: UserChat[];
}
