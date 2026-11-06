import { z } from 'zod';

export const rechargeSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .min(50, 'Minimum recharge is ₹50')
    .max(50000, 'Maximum recharge is ₹50,000'),
  paymentMethod: z.string().optional().default('upi'),
});

export type RechargeInput = z.infer<typeof rechargeSchema>;
