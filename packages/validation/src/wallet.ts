import { z } from 'zod';

export const rechargeSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .min(50, 'Minimum recharge is ₹50')
    .max(50000, 'Maximum recharge is ₹50,000'),
  paymentMethod: z.string().optional().default('upi'),
});

export type RechargeInput = z.infer<typeof rechargeSchema>;

export const withdrawSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .min(100, 'Minimum withdrawal is ₹100')
    .max(100000, 'Maximum withdrawal is ₹100,000'),
  accountDetails: z.string().min(3, 'Bank / UPI details required').optional().default('UPI'),
});

export type WithdrawInput = z.infer<typeof withdrawSchema>;
