export type BusinessCalendar = { timezone: string; workdays: number[]; startMinute: number; endMinute: number };

const weekday: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

export function addBusinessMinutes(start: Date, minutes: number, calendar: BusinessCalendar) {
  if (!Number.isInteger(minutes) || minutes < 1) throw new Error('Business minutes must be positive');
  if (!calendar.workdays.length || calendar.startMinute < 0 || calendar.endMinute <= calendar.startMinute || calendar.endMinute > 1440) throw new Error('Invalid business calendar');
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: calendar.timezone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  let cursor = new Date(start.getTime());
  let remaining = minutes;
  while (remaining > 0) {
    cursor = new Date(cursor.getTime() + 60_000);
    const parts = Object.fromEntries(formatter.formatToParts(cursor).filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
    const minute = Number(parts.hour) * 60 + Number(parts.minute);
    if (calendar.workdays.includes(weekday[parts.weekday]) && minute > calendar.startMinute && minute <= calendar.endMinute) remaining--;
  }
  return cursor;
}
