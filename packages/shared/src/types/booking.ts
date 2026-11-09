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
  studentAvatar?: string | null;
  studentEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EducatorEarningsSummary {
  totalEarnings: number;
  completedBookingsCount: number;
  confirmedBookingsCount: number;
  cancelledBookingsCount: number;
  totalBookingsCount: number;
}

export interface CreateBookingRequest {
  educatorId: string;
  slotId: string;
  notes?: string;
}
