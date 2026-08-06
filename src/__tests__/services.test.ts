import { nextDueDate, nextBillDueDate } from '../utils/dateUtils';
import { addDays, addWeeks, addMonths } from 'date-fns';

describe('Recurrence Date Calculations', () => {
  const baseDate = new Date('2026-08-05T12:00:00Z');

  test('task nextDueDate daily', () => {
    const next = nextDueDate(baseDate, 'daily', 1);
    expect(next.getDate()).toBe(6);
  });

  test('task nextDueDate weekly', () => {
    const next = nextDueDate(baseDate, 'weekly', 1);
    expect(next.getDate()).toBe(12);
  });

  test('task nextDueDate monthly', () => {
    const next = nextDueDate(baseDate, 'monthly', 1);
    expect(next.getMonth()).toBe(8); // September (0-indexed 8)
  });

  test('task nextDueDate every_x_days', () => {
    const next = nextDueDate(baseDate, 'every_x_days', 3);
    expect(next.getDate()).toBe(8);
  });

  test('bill nextBillDueDate monthly', () => {
    const next = nextBillDueDate(baseDate, 'monthly', 1);
    expect(next.getMonth()).toBe(8);
  });
});
