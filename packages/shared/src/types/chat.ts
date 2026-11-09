export interface SessionBookingInfo {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface SessionTimeAccess {
  canChat: boolean;
  status: 'active' | 'upcoming' | 'expired' | 'no_booking';
  message: string;
  activeBooking?: SessionBookingInfo;
  nextBooking?: SessionBookingInfo;
  lastBooking?: SessionBookingInfo;
}

export interface ChatRoom {
  id: string;
  educatorId: string;
  educatorName: string;
  educatorAvatar: string;
  isOnline: boolean;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
  sessionStatus?: SessionTimeAccess;
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
