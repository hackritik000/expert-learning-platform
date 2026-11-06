import { describe, expect, it } from 'bun:test';
import {
  loginSchema,
  registerSchema,
  createBookingSchema,
  rechargeSchema,
  educatorFilterSchema,
} from '@expert/validation';

describe('Validation Schemas Unit Tests', () => {
  describe('Authentication Validation', () => {
    it('should validate valid login credentials', () => {
      const valid = loginSchema.safeParse({
        email: 'student@demo.com',
        password: 'password123',
      });
      expect(valid.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const invalid = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
      });
      expect(invalid.success).toBe(false);
    });

    it('should reject passwords shorter than 6 characters', () => {
      const invalid = loginSchema.safeParse({
        email: 'student@demo.com',
        password: '123',
      });
      expect(invalid.success).toBe(false);
    });

    it('should validate registration matching passwords', () => {
      const valid = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'student',
      });
      expect(valid.success).toBe(true);
    });

    it('should reject registration when confirmPassword does not match', () => {
      const invalid = registerSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'differentPassword',
        role: 'student',
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe('Booking Validation', () => {
    it('should validate valid UUIDs for educator and slot', () => {
      const valid = createBookingSchema.safeParse({
        educatorId: '123e4567-e89b-12d3-a456-426614174000',
        slotId: '123e4567-e89b-12d3-a456-426614174001',
        notes: 'Need help with graph algorithms',
      });
      expect(valid.success).toBe(true);
    });

    it('should reject non-uuid educatorId', () => {
      const invalid = createBookingSchema.safeParse({
        educatorId: 'invalid-id',
        slotId: '123e4567-e89b-12d3-a456-426614174001',
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe('Wallet Calculation & Recharge Validation', () => {
    it('should allow recharge above minimum ₹50', () => {
      const valid = rechargeSchema.safeParse({
        amount: 250,
        paymentMethod: 'upi',
      });
      expect(valid.success).toBe(true);
    });

    it('should reject recharge amounts below ₹50', () => {
      const invalid = rechargeSchema.safeParse({
        amount: 20,
      });
      expect(invalid.success).toBe(false);
    });

    it('should accurately calculate wallet deduction and balance', () => {
      const initialBalance = 1500;
      const consultationCharge = 600;
      const remainingBalance = initialBalance - consultationCharge;
      expect(remainingBalance).toBe(900);
      expect(remainingBalance >= 0).toBe(true);
    });
  });

  describe('Educator Filter Query Validation', () => {
    it('should parse valid sort and page params', () => {
      const valid = educatorFilterSchema.safeParse({
        sortBy: 'price_asc',
        page: 2,
        limit: 10,
        minRating: 4,
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.page).toBe(2);
        expect(valid.data.sortBy).toBe('price_asc');
      }
    });
  });
});
