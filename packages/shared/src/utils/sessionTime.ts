import type { SessionTimeAccess } from '../types/chat';

/**
 * Parses a slot date string (YYYY-MM-DD) and time string (e.g. "10:00 AM", "02:30 PM", "14:30")
 * into a valid JavaScript Date object.
 */
export function parseSlotDateTime(dateStr?: string | null, timeStr?: string | null): Date | null {
  if (!dateStr || !timeStr) return null;

  const dateParts = dateStr.trim().split('-');
  if (dateParts.length !== 3) return null;
  const year = Number(dateParts[0]);
  const month = Number(dateParts[1]) - 1;
  const day = Number(dateParts[2]);

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null;

  const trimmedTime = timeStr.trim();
  const match = trimmedTime.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3]?.toUpperCase();

  if (period === 'PM' && hours < 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  const date = new Date(year, month, day, hours, minutes, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Evaluates whether a student can access consultation chat right now based on their confirmed bookings.
 * Enforces: "student cannot chat without purchasing time slot and can only talk in time which is purchased not after not before"
 */
export function evaluateSessionAccess(
  bookingsList: Array<{
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
  }>,
  now: Date = new Date(),
): SessionTimeAccess {
  const confirmed = bookingsList.filter((b) => b.status === 'confirmed');
  if (confirmed.length === 0) {
    return {
      canChat: false,
      status: 'no_booking',
      message: 'You must purchase a consultation time slot before chatting.',
    };
  }

  // 1. Check for an active session right now
  for (const b of confirmed) {
    const start = parseSlotDateTime(b.date, b.startTime);
    const end = parseSlotDateTime(b.date, b.endTime);

    if (start && end && now >= start && now <= end) {
      return {
        canChat: true,
        status: 'active',
        message: `Consultation session is active until ${b.endTime}.`,
        activeBooking: {
          id: b.id,
          date: b.date,
          startTime: b.startTime,
          endTime: b.endTime,
        },
      };
    }
  }

  // 2. Separate into upcoming vs past bookings
  const upcoming: Array<{
    booking: (typeof confirmed)[0];
    start: Date;
    end: Date;
  }> = [];
  const past: Array<{
    booking: (typeof confirmed)[0];
    start: Date;
    end: Date;
  }> = [];

  for (const b of confirmed) {
    const start = parseSlotDateTime(b.date, b.startTime);
    const end = parseSlotDateTime(b.date, b.endTime);
    if (!start || !end) continue;

    if (now < start) {
      upcoming.push({ booking: b, start, end });
    } else if (now > end) {
      past.push({ booking: b, start, end });
    }
  }

  // If there are upcoming bookings, chat will open at the earliest upcoming slot
  if (upcoming.length > 0) {
    upcoming.sort((a, b) => a.start.getTime() - b.start.getTime());
    const next = upcoming[0].booking;
    return {
      canChat: false,
      status: 'upcoming',
      message: `Chat will be available during your scheduled session on ${next.date} (${next.startTime} - ${next.endTime}).`,
      nextBooking: {
        id: next.id,
        date: next.date,
        startTime: next.startTime,
        endTime: next.endTime,
      },
    };
  }

  // If all bookings are in the past, session has expired
  past.sort((a, b) => b.end.getTime() - a.end.getTime());
  const last = past[0]?.booking;
  return {
    canChat: false,
    status: 'expired',
    message: last
      ? `Your consultation session on ${last.date} ended at ${last.endTime}. Please purchase a new time slot to chat.`
      : 'Your consultation session has ended. Please purchase a new time slot to chat.',
    lastBooking: last
      ? {
          id: last.id,
          date: last.date,
          startTime: last.startTime,
          endTime: last.endTime,
        }
      : undefined,
  };
}
