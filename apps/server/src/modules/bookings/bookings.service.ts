import { combineDateAndTime } from '@repo/shared';
import type { CreateBookingInput } from '@repo/validation';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../database/db';
import {
  bookings,
  chats,
  educatorAvailability,
  educators,
  users,
  wallets,
  walletTransactions,
} from '../../database/schema';

export class BookingsService {
  async createBooking(userId: string, data: CreateBookingInput) {
    return db.transaction(async (tx) => {
      // 1. Fetch and lock slot
      const [slot] = await tx
        .select()
        .from(educatorAvailability)
        .where(
          and(
            eq(educatorAvailability.id, data.slotId),
            eq(educatorAvailability.educatorId, data.educatorId),
          ),
        )
        .for('update');

      if (!slot) {
        throw new Error('Selected time slot does not exist');
      }

      if (slot.isBooked) {
        throw new Error('This time slot has already been booked by another student');
      }

      // 2. Fetch educator
      const [educator] = await tx.select().from(educators).where(eq(educators.id, data.educatorId));

      if (!educator) {
        throw new Error('Educator not found');
      }

      // 3. Fetch and lock wallet
      const [wallet] = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.userId, userId))
        .for('update');

      if (!wallet) {
        throw new Error('Wallet not found. Please contact support.');
      }

      if (wallet.balance < educator.hourlyRate) {
        throw new Error(
          `Insufficient wallet balance. Required: ₹${educator.hourlyRate}, Available: ₹${wallet.balance}. Please recharge your wallet.`,
        );
      }

      // 4. Mark slot as booked
      await tx
        .update(educatorAvailability)
        .set({ isBooked: true })
        .where(eq(educatorAvailability.id, slot.id));

      // 5. Deduct wallet balance
      const newBalance = wallet.balance - educator.hourlyRate;

      await tx
        .update(wallets)
        .set({
          balance: newBalance,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, wallet.id));

      // 6. Create booking
      const [booking] = await tx
        .insert(bookings)
        .values({
          userId,
          educatorId: educator.id,
          slotId: slot.id,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          amount: educator.hourlyRate,
          status: 'confirmed',
          notes: data.notes || null,
        })
        .returning();

      // 7. Record wallet transaction
      await tx.insert(walletTransactions).values({
        walletId: wallet.id,
        userId,
        amount: -educator.hourlyRate,
        type: 'consultation_payment',
        status: 'success',
        description: `Consultation with ${educator.name}`,
        referenceId: booking.id,
      });

      // 8. Ensure chat room exists
      await tx
        .insert(chats)
        .values({
          educatorId: educator.id,
          userId,
        })
        .onConflictDoNothing();

      return {
        id: booking.id,
        userId: booking.userId,
        educatorId: booking.educatorId,
        slotId: booking.slotId,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        amount: booking.amount,
        status: booking.status,
        notes: booking.notes,
        educatorName: educator.name,
        educatorAvatar: educator.avatarUrl,
        educatorTitle: educator.title,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      };
    });
  }

  async getUserBookings(userId: string) {
    // Check if the current user is an educator
    const [educator] = await db
      .select({ id: educators.id })
      .from(educators)
      .where(eq(educators.userId, userId))
      .limit(1);

    if (educator) {
      // Return bookings where this educator is the educator
      const list = await db
        .select({
          id: bookings.id,
          userId: bookings.userId,
          educatorId: bookings.educatorId,
          slotId: bookings.slotId,
          date: bookings.date,
          startTime: bookings.startTime,
          endTime: bookings.endTime,
          amount: bookings.amount,
          status: bookings.status,
          notes: bookings.notes,
          createdAt: bookings.createdAt,
          updatedAt: bookings.updatedAt,
          educatorName: educators.name,
          educatorAvatar: educators.avatarUrl,
          educatorTitle: educators.title,
          studentName: users.name,
          studentAvatar: users.avatarUrl,
          studentEmail: users.email,
        })
        .from(bookings)
        .innerJoin(educators, eq(bookings.educatorId, educators.id))
        .innerJoin(users, eq(bookings.userId, users.id))
        .where(eq(bookings.educatorId, educator.id))
        .orderBy(desc(bookings.createdAt));

      return list;
    }

    // Default: Return bookings made by the student
    const list = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        educatorId: bookings.educatorId,
        slotId: bookings.slotId,
        date: bookings.date,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        amount: bookings.amount,
        status: bookings.status,
        notes: bookings.notes,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        educatorName: educators.name,
        educatorAvatar: educators.avatarUrl,
        educatorTitle: educators.title,
        studentName: users.name,
        studentAvatar: users.avatarUrl,
        studentEmail: users.email,
      })
      .from(bookings)
      .innerJoin(educators, eq(bookings.educatorId, educators.id))
      .innerJoin(users, eq(bookings.userId, users.id))
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.createdAt));

    return list;
  }

  async getEducatorEarnings(userId: string) {
    const [educator] = await db
      .select({ id: educators.id })
      .from(educators)
      .where(eq(educators.userId, userId))
      .limit(1);

    if (!educator) {
      return {
        totalEarnings: 0,
        completedBookingsCount: 0,
        confirmedBookingsCount: 0,
        cancelledBookingsCount: 0,
        bookings: [],
      };
    }

    const educatorBookings = await db
      .select({
        id: bookings.id,
        amount: bookings.amount,
        status: bookings.status,
      })
      .from(bookings)
      .where(eq(bookings.educatorId, educator.id));

    let totalEarnings = 0;
    let completedBookingsCount = 0;
    let confirmedBookingsCount = 0;
    let cancelledBookingsCount = 0;

    for (const b of educatorBookings) {
      if (b.status === 'completed' || b.status === 'confirmed') {
        totalEarnings += b.amount;
      }
      if (b.status === 'completed') {
        completedBookingsCount++;
      } else if (b.status === 'confirmed') {
        confirmedBookingsCount++;
      } else if (b.status === 'cancelled') {
        cancelledBookingsCount++;
      }
    }

    return {
      totalEarnings,
      completedBookingsCount,
      confirmedBookingsCount,
      cancelledBookingsCount,
      totalBookingsCount: educatorBookings.length,
    };
  }

  async completeBooking(userId: string, id: string) {
    const [educator] = await db
      .select({ id: educators.id })
      .from(educators)
      .where(eq(educators.userId, userId))
      .limit(1);

    if (!educator) {
      throw new Error('Only educators can complete a session');
    }

    const [booking] = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, id), eq(bookings.educatorId, educator.id)));

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === 'cancelled') {
      throw new Error('Cannot complete a cancelled booking');
    }

    if (booking.status === 'completed') {
      return booking;
    }

    return db.transaction(async (tx) => {
      const [updated] = await tx
        .update(bookings)
        .set({
          status: 'completed',
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, id))
        .returning();

      // Ensure educator wallet exists
      await tx
        .insert(wallets)
        .values({
          userId,
          balance: 0,
          currency: 'INR',
        })
        .onConflictDoNothing({ target: wallets.userId });

      // Lock educator wallet
      const [educatorWallet] = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.userId, userId))
        .for('update')
        .limit(1);

      if (educatorWallet) {
        const newBalance = educatorWallet.balance + booking.amount;
        await tx
          .update(wallets)
          .set({
            balance: newBalance,
            updatedAt: new Date(),
          })
          .where(eq(wallets.id, educatorWallet.id));

        await tx.insert(walletTransactions).values({
          walletId: educatorWallet.id,
          userId,
          amount: booking.amount,
          type: 'consultation_payment',
          status: 'success',
          description: `Consultation Fee Earned for Session #${booking.id.slice(0, 8)}`,
          referenceId: booking.id,
        });
      }

      return updated;
    });
  }

  async getBookingById(userId: string, id: string) {
    const [educator] = await db
      .select({ id: educators.id })
      .from(educators)
      .where(eq(educators.userId, userId))
      .limit(1);

    const [booking] = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        educatorId: bookings.educatorId,
        slotId: bookings.slotId,
        date: bookings.date,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        amount: bookings.amount,
        status: bookings.status,
        notes: bookings.notes,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        educatorName: educators.name,
        educatorAvatar: educators.avatarUrl,
        educatorTitle: educators.title,
        studentName: users.name,
        studentAvatar: users.avatarUrl,
        studentEmail: users.email,
      })
      .from(bookings)
      .innerJoin(educators, eq(bookings.educatorId, educators.id))
      .innerJoin(users, eq(bookings.userId, users.id))
      .where(
        and(
          eq(bookings.id, id),
          educator ? eq(bookings.educatorId, educator.id) : eq(bookings.userId, userId),
        ),
      );

    if (!booking) {
      throw new Error('Booking not found');
    }

    return booking;
  }

  async cancelBooking(userId: string, id: string, reason?: string) {
    const [educator] = await db
      .select({ id: educators.id })
      .from(educators)
      .where(eq(educators.userId, userId))
      .limit(1);

    return db.transaction(async (tx) => {
      // 1. Fetch and lock booking
      const [booking] = await tx
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.id, id),
            educator ? eq(bookings.educatorId, educator.id) : eq(bookings.userId, userId),
          ),
        )
        .for('update');

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.status === 'cancelled') {
        throw new Error('Booking is already cancelled');
      }

      if (booking.status === 'completed') {
        throw new Error('Completed bookings cannot be cancelled');
      }

      const bookingStart = combineDateAndTime(booking.date, booking.startTime);

      if (bookingStart <= new Date()) {
        throw new Error('Bookings cannot be cancelled after they have started.');
      }

      // 2. Mark booking as cancelled
      await tx
        .update(bookings)
        .set({
          status: 'cancelled',
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, id));

      // 3. Release slot
      await tx
        .update(educatorAvailability)
        .set({ isBooked: false })
        .where(eq(educatorAvailability.id, booking.slotId));

      // 4. Fetch and lock wallet of the student who paid for this booking
      const studentUserId = booking.userId;
      const [wallet] = await tx
        .select()
        .from(wallets)
        .where(eq(wallets.userId, studentUserId))
        .for('update');

      if (!wallet) {
        throw new Error('Student wallet not found for refund.');
      }

      // 5. Refund student wallet balance
      const newBalance = wallet.balance + booking.amount;

      await tx
        .update(wallets)
        .set({
          balance: newBalance,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, wallet.id));

      // 6. Record refund transaction for the student
      await tx.insert(walletTransactions).values({
        walletId: wallet.id,
        userId: studentUserId,
        amount: booking.amount,
        type: 'refund',
        status: 'success',
        description: `Refund for cancelled booking #${booking.id.slice(0, 8)}`,
        referenceId: booking.id,
      });

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
