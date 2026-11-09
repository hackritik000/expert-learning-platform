import { describe, expect, it } from 'bun:test';
import { evaluateSessionAccess } from '@repo/shared';
import { db } from '../src/database/db';
import { bookings, educatorAvailability, educators, users } from '../src/database/schema';
import { educatorsService } from '../src/modules/educators/educators.service';
import { chatService } from '../src/modules/chat/chat.service';
import { and, eq } from 'drizzle-orm';

describe('Educator Slot Management & Student Chat Access Enforcement', () => {
  describe('evaluateSessionAccess helper', () => {
    it('returns no_booking when student has no confirmed bookings', () => {
      const access = evaluateSessionAccess([]);
      expect(access.canChat).toBe(false);
      expect(access.status).toBe('no_booking');
      expect(access.message).toContain('must purchase a consultation time slot');
    });

    it('returns active when now is between start and end time of a confirmed booking', () => {
      const now = new Date(2026, 10, 8, 14, 30, 0); // 2026-11-08 02:30 PM
      const bookingsList = [
        {
          id: 'b1',
          date: '2026-11-08',
          startTime: '02:00 PM',
          endTime: '03:00 PM',
          status: 'confirmed',
        },
      ];
      const access = evaluateSessionAccess(bookingsList, now);
      expect(access.canChat).toBe(true);
      expect(access.status).toBe('active');
      expect(access.activeBooking?.id).toBe('b1');
    });

    it('returns upcoming when session is in the future (not before)', () => {
      const now = new Date(2026, 10, 8, 10, 0, 0); // 10:00 AM
      const bookingsList = [
        {
          id: 'b2',
          date: '2026-11-08',
          startTime: '02:00 PM',
          endTime: '03:00 PM',
          status: 'confirmed',
        },
      ];
      const access = evaluateSessionAccess(bookingsList, now);
      expect(access.canChat).toBe(false);
      expect(access.status).toBe('upcoming');
      expect(access.message).toContain('Chat will be available during your scheduled session');
      expect(access.nextBooking?.startTime).toBe('02:00 PM');
    });

    it('returns expired when session has already ended (not after)', () => {
      const now = new Date(2026, 10, 8, 16, 0, 0); // 04:00 PM
      const bookingsList = [
        {
          id: 'b3',
          date: '2026-11-08',
          startTime: '02:00 PM',
          endTime: '03:00 PM',
          status: 'confirmed',
        },
      ];
      const access = evaluateSessionAccess(bookingsList, now);
      expect(access.canChat).toBe(false);
      expect(access.status).toBe('expired');
      expect(access.message).toContain('ended');
      expect(access.lastBooking?.endTime).toBe('03:00 PM');
    });
  });

  describe('Educator Slot Management Services', () => {
    it('allows an educator to view their own slots', async () => {
      const [educatorUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, 'ananya@expert.com'));
      expect(educatorUser).toBeDefined();

      const slots = await educatorsService.getMySlots(educatorUser.id);
      expect(Array.isArray(slots)).toBe(true);
      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0].date).toBeDefined();
      expect(slots[0].startTime).toBeDefined();
      expect(slots[0].endTime).toBeDefined();
    });

    it('allows an educator to create, update, and delete an available time slot', async () => {
      const [educatorUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, 'ananya@expert.com'));

      // 1. Create a new slot
      const createdSlot = await educatorsService.createSlot(educatorUser.id, {
        date: '2026-12-01',
        startTime: '09:00 AM',
        endTime: '10:00 AM',
      });

      expect(createdSlot).toBeDefined();
      expect(createdSlot.date).toBe('2026-12-01');
      expect(createdSlot.startTime).toBe('09:00 AM');
      expect(createdSlot.endTime).toBe('10:00 AM');
      expect(createdSlot.isBooked).toBe(false);

      // 2. Reject duplicate slot creation
      expect(
        educatorsService.createSlot(educatorUser.id, {
          date: '2026-12-01',
          startTime: '09:00 AM',
          endTime: '10:00 AM',
        }),
      ).rejects.toThrow('already exists');

      // 3. Update the slot time
      const updatedSlot = await educatorsService.updateSlot(educatorUser.id, createdSlot.id, {
        date: '2026-12-01',
        startTime: '02:00 PM',
        endTime: '03:00 PM',
      });

      expect(updatedSlot.startTime).toBe('02:00 PM');
      expect(updatedSlot.endTime).toBe('03:00 PM');

      // 4. Delete the slot
      const deleteResult = await educatorsService.deleteSlot(educatorUser.id, createdSlot.id);
      expect(deleteResult.message).toContain('deleted');

      // Verify deletion from db
      const [deleted] = await db
        .select()
        .from(educatorAvailability)
        .where(eq(educatorAvailability.id, createdSlot.id));
      expect(deleted).toBeUndefined();
    });

    it('prevents modifying or deleting a booked slot', async () => {
      const [educatorUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, 'ananya@expert.com'));
      const [educator] = await db
        .select()
        .from(educators)
        .where(eq(educators.userId, educatorUser.id));

      // Find an already booked slot
      const [bookedSlot] = await db
        .select()
        .from(educatorAvailability)
        .where(
          and(
            eq(educatorAvailability.educatorId, educator.id),
            eq(educatorAvailability.isBooked, true),
          ),
        );

      if (bookedSlot) {
        expect(
          educatorsService.updateSlot(educatorUser.id, bookedSlot.id, {
            startTime: '04:00 PM',
            endTime: '05:00 PM',
          }),
        ).rejects.toThrow('Cannot modify a time slot that has already been booked');

        expect(educatorsService.deleteSlot(educatorUser.id, bookedSlot.id)).rejects.toThrow(
          'Cannot delete a time slot that has already been booked',
        );
      }
    });
  });

  describe('Student Chat Timing Enforcement', () => {
    it('prevents student from chatting without purchasing a time slot', async () => {
      // Find a student and educator where student has never booked
      const [student] = await db.select().from(users).where(eq(users.email, 'student@demo.com'));
      const [rajesh] = await db.select().from(users).where(eq(users.email, 'rajesh@expert.com'));
      const [rajeshEd] = await db.select().from(educators).where(eq(educators.userId, rajesh.id));

      // Get or create chat room
      const chatRoom = await chatService.getOrCreateChatByEducator(student.id, rajeshEd.id);
      expect(chatRoom.sessionStatus?.status).toBe('no_booking');
      expect(chatRoom.sessionStatus?.canChat).toBe(false);

      // Attempting to send message should fail
      expect(
        chatService.sendMessage(student.id, chatRoom.id, 'Hello without booking'),
      ).rejects.toThrow('must purchase a consultation time slot before chatting');
    });

    it('allows student to chat during active booked slot, but blocks before or after', async () => {
      const [student] = await db.select().from(users).where(eq(users.email, 'student@demo.com'));
      const [priya] = await db.select().from(users).where(eq(users.email, 'priya@expert.com'));
      const [priyaEd] = await db.select().from(educators).where(eq(educators.userId, priya.id));

      const chatRoom = await chatService.getOrCreateChatByEducator(student.id, priyaEd.id);

      // 1. Create a future slot & booking (tomorrow) -> student cannot chat ("not before")
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().slice(0, 10);

      const [futureSlot] = await db
        .insert(educatorAvailability)
        .values({
          educatorId: priyaEd.id,
          date: tomorrowStr,
          startTime: '10:00 AM',
          endTime: '11:00 AM',
          isBooked: true,
        })
        .returning();

      const [futureBooking] = await db
        .insert(bookings)
        .values({
          userId: student.id,
          educatorId: priyaEd.id,
          slotId: futureSlot.id,
          date: futureSlot.date,
          startTime: futureSlot.startTime,
          endTime: futureSlot.endTime,
          amount: 500,
          status: 'confirmed',
        })
        .returning();

      // Expect sendMessage to be blocked because it is before the scheduled slot
      expect(chatService.sendMessage(student.id, chatRoom.id, 'Hello before slot')).rejects.toThrow(
        'Chat will be available during your scheduled session',
      );

      // 2. Create an active slot covering current time right now
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);

      const [activeSlot] = await db
        .insert(educatorAvailability)
        .values({
          educatorId: priyaEd.id,
          date: todayStr,
          startTime: '01:00 AM', // guaranteed string comparison if needed
          endTime: '11:59 PM',
          isBooked: true,
        })
        .returning();

      const [activeBooking] = await db
        .insert(bookings)
        .values({
          userId: student.id,
          educatorId: priyaEd.id,
          slotId: activeSlot.id,
          date: activeSlot.date,
          startTime: activeSlot.startTime,
          endTime: activeSlot.endTime,
          amount: 500,
          status: 'confirmed',
        })
        .returning();

      // Since activeBooking is live right now, student CAN send message!
      const sentMsg = await chatService.sendMessage(
        student.id,
        chatRoom.id,
        'Live consultation message during booked slot',
      );

      expect(sentMsg).toBeDefined();
      expect(sentMsg.content).toBe('Live consultation message during booked slot');
      expect(sentMsg.senderRole).toBe('student');

      // Cleanup test bookings and slots
      await db.delete(bookings).where(eq(bookings.id, activeBooking.id));
      await db.delete(educatorAvailability).where(eq(educatorAvailability.id, activeSlot.id));
      await db.delete(bookings).where(eq(bookings.id, futureBooking.id));
      await db.delete(educatorAvailability).where(eq(educatorAvailability.id, futureSlot.id));
    });
  });
});
