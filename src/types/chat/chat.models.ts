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
  receiverId: string;
  timestamp: string;
  isRead?: boolean;
}

export interface UserChat {
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
  lastMessage?: string | null;
  // Optional fields that might come from a different endpoint or be added later
  userId?: string;
  userName?: string;
  displayName?: string;
  image?: string;
  status?: 'online' | 'offline' | 'away';
  unreadCount?: number;
}

export interface ApiChatResponse {
  isSuccess: boolean;
  statusCode: number;
  error: any;
  data: UserChat[];
}
