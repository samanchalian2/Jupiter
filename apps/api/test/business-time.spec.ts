import { describe, expect, it } from 'vitest';
import { addBusinessMinutes } from '../src/sla/business-time.js';

describe('business SLA time', () => {
  it('uses each tenant calendar independently', () => {
    const fridayAfternoon = new Date('2026-08-14T16:30:00.000Z');
    const weekdayOnly = addBusinessMinutes(fridayAfternoon, 60, { timezone: 'UTC', workdays: [1,2,3,4,5], startMinute: 9 * 60, endMinute: 17 * 60 });
    const everyDay = addBusinessMinutes(fridayAfternoon, 60, { timezone: 'UTC', workdays: [1,2,3,4,5,6,7], startMinute: 9 * 60, endMinute: 17 * 60 });
    expect(weekdayOnly.toISOString()).toBe('2026-08-17T09:30:00.000Z');
    expect(everyDay.toISOString()).toBe('2026-08-15T09:30:00.000Z');
  });
});
