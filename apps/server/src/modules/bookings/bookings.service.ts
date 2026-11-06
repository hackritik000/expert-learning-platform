import { and, eq, desc } from 'drizzle-orm';
import { db, sqlClient } from '../../database/db';
import {
  bookings,
  educatorAvailability,
  educators,
  wallets,
  walletTransactions,
  chats,
} from '../../database/schema';
import type { CreateBookingInput } from '@expert/validation';

export class BookingsService {
  async createBooking(userId: string, data: CreateBookingInput) {
    // Run booking creation and wallet deduction in a strict database transaction
    return await sqlClient.begin(async (tx) => {
      // 1. Fetch and lock slot
      const [slot] = await tx`
        SELECT * FROM educator_availability
        WHERE id = ${data.slotId} AND educator_id = ${data.educatorId}
        FOR UPDATE
      `;

      if (!slot) {
        throw new Error('Selected time slot does not exist');
      }

      if (slot.is_booked) {
        throw new Error('This time slot has already been booked by another student');
      }

      // 2. Fetch educator
      const [educator] = await tx`
        SELECT * FROM educators WHERE id = ${data.educatorId}
      `;

      if (!educator) {
        throw new Error('Educator not found');
      }

      // 3. Fetch user wallet and check balance
      const [wallet] = await tx`
        SELECT * FROM wallets WHERE user_id = ${userId}
        FOR UPDATE
      `;

      if (!wallet) {
        throw new Error('Wallet not found. Please contact support.');
      }

      if (wallet.balance < educator.hourly_rate) {
        throw new Error(
          `Insufficient wallet balance. Required: ₹${educator.hourly_rate}, Available: ₹${wallet.balance}. Please recharge your wallet.`,
        );
      }

      // 4. Mark slot as booked
      await tx`
        UPDATE educator_availability
        SET is_booked = true
        WHERE id = ${data.slotId}
      `;

      // 5. Deduct from wallet
      const newBalance = wallet.balance - educator.hourly_rate;
      await tx`
        UPDATE wallets
        SET balance = ${newBalance}, updated_at = NOW()
        WHERE id = ${wallet.id}
      `;

      // 6. Create booking record
      const [booking] = await tx`
        INSERT INTO bookings (
          user_id, educator_id, slot_id, date, start_time, end_time, amount, status, notes
        ) VALUES (
          ${userId}, ${educator.id}, ${slot.id}, ${slot.date}, ${slot.start_time}, ${slot.end_time}, ${educator.hourly_rate}, 'confirmed', ${data.notes || null}
        )
        RETURNING *
      `;

      // 7. Record wallet transaction
      await tx`
        INSERT INTO wallet_transactions (
          wallet_id, user_id, amount, type, status, description, reference_id
        ) VALUES (
          ${wallet.id}, ${userId}, ${-educator.hourly_rate}, 'consultation_payment', 'success',
          ${`Consultation with ${educator.name}`}, ${booking.id}
        )
      `;

      // 8. Ensure chat room exists between student and educator
      await tx`
        INSERT INTO chats (educator_id, user_id)
        VALUES (${educator.id}, ${userId})
        ON CONFLICT (educator_id, user_id) DO NOTHING
      `;

      return {
        id: booking.id,
        userId: booking.user_id,
        educatorId: booking.educator_id,
        slotId: booking.slot_id,
        date: booking.date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        amount: booking.amount,
        status: booking.status,
        notes: booking.notes,
        educatorName: educator.name,
        educatorAvatar: educator.avatar_url,
        educatorTitle: educator.title,
        createdAt: booking.created_at,
        updatedAt: booking.updated_at,
      };
    });
  }

  async getUserBookings(userId: string) {
    const list = await sqlClient`
      SELECT 
        b.id, b.user_id, b.educator_id, b.slot_id, b.date, b.start_time, b.end_time,
        b.amount, b.status, b.notes, b.created_at, b.updated_at,
        e.name as educator_name, e.avatar_url as educator_avatar, e.title as educator_title
      FROM bookings b
      JOIN educators e ON e.id = b.educator_id
      WHERE b.user_id = ${userId}
      ORDER BY b.created_at DESC
    `;

    return list.map((b: any) => ({
      id: b.id,
      userId: b.user_id,
      educatorId: b.educator_id,
      slotId: b.slot_id,
      date: b.date,
      startTime: b.start_time,
      endTime: b.end_time,
      amount: b.amount,
      status: b.status,
      notes: b.notes,
      educatorName: b.educator_name,
      educatorAvatar: b.educator_avatar,
      educatorTitle: b.educator_title,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    }));
  }

  async getBookingById(userId: string, id: string) {
    const [b] = await sqlClient`
      SELECT 
        b.id, b.user_id, b.educator_id, b.slot_id, b.date, b.start_time, b.end_time,
        b.amount, b.status, b.notes, b.created_at, b.updated_at,
        e.name as educator_name, e.avatar_url as educator_avatar, e.title as educator_title
      FROM bookings b
      JOIN educators e ON e.id = b.educator_id
      WHERE b.id = ${id} AND b.user_id = ${userId}
    `;

    if (!b) {
      throw new Error('Booking not found');
    }

    return {
      id: b.id,
      userId: b.user_id,
      educatorId: b.educator_id,
      slotId: b.slot_id,
      date: b.date,
      startTime: b.start_time,
      endTime: b.end_time,
      amount: b.amount,
      status: b.status,
      notes: b.notes,
      educatorName: b.educator_name,
      educatorAvatar: b.educator_avatar,
      educatorTitle: b.educator_title,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    };
  }

  async cancelBooking(userId: string, id: string, reason?: string) {
    return await sqlClient.begin(async (tx) => {
      const [booking] = await tx`
        SELECT * FROM bookings WHERE id = ${id} AND user_id = ${userId}
        FOR UPDATE
      `;

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.status === 'cancelled') {
        throw new Error('Booking is already cancelled');
      }

      if (booking.status === 'completed') {
        throw new Error('Completed bookings cannot be cancelled');
      }

      // 1. Mark booking as cancelled
      await tx`
        UPDATE bookings
        SET status = 'cancelled', updated_at = NOW()
        WHERE id = ${id}
      `;

      // 2. Release slot
      await tx`
        UPDATE educator_availability
        SET is_booked = false
        WHERE id = ${booking.slot_id}
      `;

      // 3. Refund amount to user wallet
      const [wallet] = await tx`
        SELECT * FROM wallets WHERE user_id = ${userId}
        FOR UPDATE
      `;

      const newBalance = wallet.balance + booking.amount;
      await tx`
        UPDATE wallets
        SET balance = ${newBalance}, updated_at = NOW()
        WHERE id = ${wallet.id}
      `;

      // 4. Record refund transaction
      await tx`
        INSERT INTO wallet_transactions (
          wallet_id, user_id, amount, type, status, description, reference_id
        ) VALUES (
          ${wallet.id}, ${userId}, ${booking.amount}, 'refund', 'success',
          ${`Refund for cancelled booking #${booking.id.slice(0, 8)}`}, ${booking.id}
        )
      `;

      return {
        id: booking.id,
        status: 'cancelled',
        refundAmount: booking.amount,
        newBalance,
        reason,
      };
    });
  }
}

export const bookingsService = new BookingsService();
