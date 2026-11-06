import { z } from 'zod';

export const educatorFilterSchema = z.object({
  search: z.string().optional(),
  subjectId: z.string().uuid().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  isOnline: z.coerce.boolean().optional(),
  sortBy: z.enum(['rating', 'price_asc', 'price_desc', 'experience']).optional().default('rating'),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(10),
});

export type EducatorFilterInput = z.infer<typeof educatorFilterSchema>;
