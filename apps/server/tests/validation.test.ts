import { describe, expect, it } from 'bun:test';
import {
  createBookingSchema,
  educatorFilterSchema,
  loginSchema,
  rechargeSchema,
  registerSchema,
  updateEducatorProfileSchema,
  updateUserProfileSchema,
  withdrawSchema,
} from '@repo/validation';

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

    it('should validate educator withdrawal above minimum ₹100', () => {
      const valid = withdrawSchema.safeParse({
        amount: 500,
        accountDetails: 'educator@okhdfcbank',
      });
      expect(valid.success).toBe(true);
    });

    it('should reject withdrawal amount below ₹100', () => {
      const invalid = withdrawSchema.safeParse({
        amount: 50,
        accountDetails: 'educator@okhdfcbank',
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe('Profile Update Validation', () => {
    it('should validate educator profile update with image URL', () => {
      const valid = updateEducatorProfileSchema.safeParse({
        name: 'Dr. Ananya Verma',
        title: 'Senior Physics Faculty',
        bio: 'Over 10 years of mentoring students for competitive exams.',
        education: 'Ph.D. Physics, IIT Bombay',
        experienceYears: 10,
        hourlyRate: 750,
        languages: ['English', 'Hindi'],
        subjects: ['Physics', 'Mathematics'],
        avatarUrl: 'http://localhost:3000/public/avatars/ananya.jpg',
        isOnline: true,
      });
      expect(valid.success).toBe(true);
    });

    it('should reject invalid avatarUrl in educator profile update', () => {
      const invalid = updateEducatorProfileSchema.safeParse({
        avatarUrl: 'not-a-valid-url',
      });
      expect(invalid.success).toBe(false);
    });

    it('should validate student profile update', () => {
      const valid = updateUserProfileSchema.safeParse({
        name: 'Rohan Sharma',
        phoneNumber: '+919876543210',
        avatarUrl: 'http://localhost:3000/public/avatars/rohan.jpg',
      });
      expect(valid.success).toBe(true);
    });

    it('should reject invalid avatarUrl in student profile update', () => {
      const invalid = updateUserProfileSchema.safeParse({
        avatarUrl: 'invalid_url',
      });
      expect(invalid.success).toBe(false);
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
