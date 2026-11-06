import { z } from 'zod';

export const createBookingSchema = z.object({
  educatorId: z.string().uuid('Invalid educator ID'),
  slotId: z.string().uuid('Invalid slot ID'),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const cancelBookingSchema = z.object({
  reason: z.string().max(300, 'Reason cannot exceed 300 characters').optional(),
});

export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
