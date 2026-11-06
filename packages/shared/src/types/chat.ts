export interface ChatRoom {
  id: string;
  educatorId: string;
  educatorName: string;
  educatorAvatar: string;
  isOnline: boolean;
  userId: string;
  userName: string;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'educator';
  content: string;
  createdAt: string;
}

export interface SendMessageRequest {
  content: string;
}
