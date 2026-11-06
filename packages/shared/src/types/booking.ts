export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  userId: string;
  educatorId: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  amount: number;
  status: BookingStatus;
  notes?: string | null;
  educatorName: string;
  educatorAvatar: string;
  educatorTitle: string;
  studentName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingRequest {
  educatorId: string;
  slotId: string;
  notes?: string;
}
