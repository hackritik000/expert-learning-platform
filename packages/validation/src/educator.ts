import { z } from 'zod';

export const educatorFilterSchema = z.object({
  search: z.string().optional(),
  subjectId: z.string().uuid().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  isOnline: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  sortBy: z.enum(['rating', 'price_asc', 'price_desc', 'experience']).optional().default('rating'),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(10),
});

export type EducatorFilterInput = z.infer<typeof educatorFilterSchema>;

export const registerEducatorProfileSchema = z
  .object({
    title: z.string().min(2, 'Title must be at least 2 characters'),
    bio: z.string().min(10, 'Bio must be at least 10 characters'),
    subjects: z.array(z.string().min(1, 'Subject cannot be empty')).optional(),
    subjectIds: z.array(z.string().min(1, 'Subject cannot be empty')).optional(),
    experience: z.coerce.number().min(0, 'Experience must be 0 or more years').optional(),
    experienceYears: z.coerce.number().min(0, 'Experience must be 0 or more years').optional(),
    ratePerSession: z.coerce
      .number()
      .positive('Rate per session must be greater than 0')
      .optional(),
    hourlyRate: z.coerce.number().positive('Rate per session must be greater than 0').optional(),
    rate: z.coerce.number().positive('Rate per session must be greater than 0').optional(),
    education: z.string().min(2, 'Education must be at least 2 characters').optional(),
    languages: z.array(z.string().min(1)).optional(),
    avatarUrl: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
  })
  .refine(
    (data) =>
      (Array.isArray(data.subjects) && data.subjects.length > 0) ||
      (Array.isArray(data.subjectIds) && data.subjectIds.length > 0),
    {
      message: 'At least one subject is required (subjects or subjectIds)',
      path: ['subjects'],
    },
  )
  .refine((data) => data.experience !== undefined || data.experienceYears !== undefined, {
    message: 'Experience is required (experience or experienceYears)',
    path: ['experience'],
  })
  .refine(
    (data) =>
      data.ratePerSession !== undefined || data.hourlyRate !== undefined || data.rate !== undefined,
    {
      message: 'Rate per session is required (ratePerSession, hourlyRate, or rate)',
      path: ['ratePerSession'],
    },
  );

export type RegisterEducatorProfileFormData = z.infer<typeof registerEducatorProfileSchema>;

export const updateEducatorProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  title: z.string().min(2, 'Title must be at least 2 characters').optional(),
  bio: z.string().min(10, 'Bio must be at least 10 characters').optional(),
  subjects: z.array(z.string().min(1)).optional(),
  subjectIds: z.array(z.string().min(1)).optional(),
  experience: z.coerce.number().min(0, 'Experience must be 0 or more years').optional(),
  experienceYears: z.coerce.number().min(0, 'Experience must be 0 or more years').optional(),
  ratePerSession: z.coerce.number().positive('Rate per session must be greater than 0').optional(),
  hourlyRate: z.coerce.number().positive('Rate per session must be greater than 0').optional(),
  rate: z.coerce.number().positive('Rate per session must be greater than 0').optional(),
  education: z.string().min(2).optional(),
  languages: z.array(z.string().min(1)).optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
  isOnline: z.boolean().optional(),
});

export type UpdateEducatorProfileFormData = z.infer<typeof updateEducatorProfileSchema>;

export const registerEducatorSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password must match'),
    title: z.string().min(2, 'Title must be at least 2 characters'),
    bio: z.string().min(10, 'Bio must be at least 10 characters'),
    subjects: z.array(z.string().min(1, 'Subject cannot be empty')).optional(),
    subjectIds: z.array(z.string().min(1, 'Subject cannot be empty')).optional(),
    experience: z.coerce.number().min(0, 'Experience must be 0 or more years').optional(),
    experienceYears: z.coerce.number().min(0, 'Experience must be 0 or more years').optional(),
    ratePerSession: z.coerce
      .number()
      .positive('Rate per session must be greater than 0')
      .optional(),
    hourlyRate: z.coerce.number().positive('Rate per session must be greater than 0').optional(),
    rate: z.coerce.number().positive('Rate per session must be greater than 0').optional(),
    education: z.string().min(2, 'Education must be at least 2 characters').optional(),
    languages: z.array(z.string().min(1)).optional(),
    avatarUrl: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine(
    (data) =>
      (Array.isArray(data.subjects) && data.subjects.length > 0) ||
      (Array.isArray(data.subjectIds) && data.subjectIds.length > 0),
    {
      message: 'At least one subject is required (subjects or subjectIds)',
      path: ['subjects'],
    },
  )
  .refine((data) => data.experience !== undefined || data.experienceYears !== undefined, {
    message: 'Experience is required (experience or experienceYears)',
    path: ['experience'],
  })
  .refine(
    (data) =>
      data.ratePerSession !== undefined || data.hourlyRate !== undefined || data.rate !== undefined,
    {
      message: 'Rate per session is required (ratePerSession, hourlyRate, or rate)',
      path: ['ratePerSession'],
    },
  );

export type RegisterEducatorFormData = z.infer<typeof registerEducatorSchema>;

export const createSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
});

export type CreateSlotInput = z.infer<typeof createSlotSchema>;

export const updateSlotSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  startTime: z.string().min(1, 'Start time is required').optional(),
  endTime: z.string().min(1, 'End time is required').optional(),
});

export type UpdateSlotInput = z.infer<typeof updateSlotSchema>;

export const batchCreateSlotsSchema = z.object({
  slots: z.array(createSlotSchema).min(1, 'At least one slot is required'),
});

export type BatchCreateSlotsInput = z.infer<typeof batchCreateSlotsSchema>;
