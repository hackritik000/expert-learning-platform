export interface Subject {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  description: string;
}

export interface Review {
  id: string;
  studentName: string;
  studentAvatar?: string | null;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface TimeSlot {
  id: string;
  educatorId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isBooked: boolean;
}

export interface ManagedTimeSlot extends TimeSlot {
  studentName?: string | null;
  bookingId?: string | null;
  bookingStatus?: string | null;
  createdAt?: string;
}

export interface Educator {
  id: string;
  userId: string;
  name: string;
  title: string;
  bio: string;
  avatarUrl: string;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  hourlyRate: number; // consultation rate (e.g. ₹500)
  isOnline: boolean;
  isVerified: boolean;
  education: string;
  languages: string[];
  subjects: Subject[];
  availableSlots?: TimeSlot[];
  reviews?: Review[];
}

export interface EducatorFilterParams {
  search?: string;
  subjectId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  isOnline?: boolean;
  sortBy?: 'rating' | 'price_asc' | 'price_desc' | 'experience';
  page?: number;
  limit?: number;
}

export interface RegisterEducatorProfileInput {
  title: string;
  bio: string;
  subjects?: string[];
  subjectIds?: string[];
  experience?: number;
  experienceYears?: number;
  ratePerSession?: number;
  hourlyRate?: number;
  rate?: number;
  education?: string;
  languages?: string[];
  avatarUrl?: string;
}

export interface UpdateEducatorProfileInput {
  title?: string;
  bio?: string;
  subjects?: string[];
  subjectIds?: string[];
  experience?: number;
  experienceYears?: number;
  ratePerSession?: number;
  hourlyRate?: number;
  rate?: number;
  education?: string;
  languages?: string[];
  avatarUrl?: string;
  isOnline?: boolean;
}

export interface RegisterEducatorInput extends RegisterEducatorProfileInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}
