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
  status?: 'sent' | 'delivered' | 'seen';
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

// New shape based on /chat/user-chats response
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
  receiver?: {
    displayName: string;
    image?: string | null;
  };
  chat: {
    id: string;
    isGroupChat: boolean;
    groupName?: string | null;
    participantsIds?: Array<{
      timestamp: number;
      creationTime: string;
    }>;
    adminId?: string | null;
    createdAt: string;
    lastMessageAt: string;
    lastMessage?: any;
  };
}

export interface ApiChatResponse {
  isSuccess: boolean;
  statusCode: number;
  error: any;
  data: UserChat[];
}
