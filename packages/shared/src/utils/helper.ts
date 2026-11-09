export function convertTo24Hour(time: string) {
  const [timePart, period] = time.split(' ');
  let [hours, minutes] = timePart.split(':').map(Number);

  hours = (hours % 12) + (period === 'PM' ? 12 : 0);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}

/**
 * Combines a date and 12-hour time into a JavaScript Date.
 *
 * @param date - YYYY-MM-DD
 * @param time - hh:mm AM/PM
 */
export function combineDateAndTime(date: string, time: string): Date {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) {
    throw new Error(`Invalid time format: ${time}`);
  }

  const [, hourString, minuteString, period] = match;

  let hours = Number(hourString);
  const minutes = Number(minuteString);

  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time: ${time}`);
  }

  hours = (hours % 12) + (period.toUpperCase() === 'PM' ? 12 : 0);

  const result = new Date(`${date}T00:00:00`);
  result.setHours(hours, minutes, 0, 0);

  if (Number.isNaN(result.getTime())) {
    throw new Error(`Invalid date: ${date}`);
  }

  return result;
}
