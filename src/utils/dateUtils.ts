import { addDays, addWeeks, addMonths } from 'date-fns';
import { RecurrenceType } from '../db/models/Task';

/** Compute the next due date from a given date given a task recurrence rule */
export function nextDueDate(from: Date, type: RecurrenceType, interval: number): Date {
  switch (type) {
    case 'daily':
      return addDays(from, 1);
    case 'weekly':
      return addWeeks(from, 1);
    case 'monthly':
      return addMonths(from, 1);
    case 'every_x_days':
      return addDays(from, interval);
    default:
      return from;
  }
}

/** Compute the next due date for a bill */
export function nextBillDueDate(from: Date, type: RecurrenceType, interval: number): Date {
  switch (type) {
    case 'monthly':
      return addMonths(from, 1);
    case 'weekly':
      return addWeeks(from, 1);
    case 'every_x_days':
      return addDays(from, interval);
    default:
      return from;
  }
}
