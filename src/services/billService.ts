import { database, bills, billRules } from '../db';
import { Bill, BillRule } from '../db/models/Bill';
import { addDays, addWeeks, addMonths, startOfMonth, endOfMonth, isBefore, isAfter } from 'date-fns';
import { RecurrenceType } from '../db/models/Task';

const SYSTEM_USER = 'system';

import { nextBillDueDate } from '../utils/dateUtils';
export { nextBillDueDate };

/** Mark a bill as paid; archives it based on settings */
export async function markBillPaid(bill: Bill): Promise<void> {
  await database.write(async () => {
    await bill.update(b => {
      b.isPaid = true;
      (b as any)._raw.paid_at = Date.now();
      b.updatedBy = SYSTEM_USER;
    });
  });
}

/** Archive a bill */
export async function archiveBill(bill: Bill): Promise<void> {
  await database.write(async () => {
    await bill.update(b => {
      b.isArchived = true;
      b.updatedBy = SYSTEM_USER;
    });
  });
}

/** Get active (unpaid, not archived) bills */
export async function getActiveBills(): Promise<Bill[]> {
  const all = await bills.query().fetch();
  return all.filter(b => !b.isPaid && !b.isArchived);
}

/** Get overdue bills (unpaid, past due date) */
export async function getOverdueBills(): Promise<Bill[]> {
  const now = new Date();
  const all = await bills.query().fetch();
  return all.filter(b => !b.isPaid && !b.isArchived && isBefore(b.dueDate, now));
}

/** Calculate monthly spending totals */
export async function getMonthlyBudget(): Promise<{ spent: number; paid: number }> {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);

  const all = await bills.query().fetch();
  const thisMonth = all.filter(b =>
    !b.isArchived &&
    isAfter(b.dueDate, start) &&
    isBefore(b.dueDate, end)
  );

  const spent = thisMonth.reduce((sum, b) => sum + b.amount, 0);
  const paid = thisMonth.filter(b => b.isPaid).reduce((sum, b) => sum + b.amount, 0);
  return { spent, paid };
}

/** Generate next bill instance from rule */
export async function generateNextBillInstance(rule: BillRule): Promise<void> {
  if (!rule.isActive || rule.recurrenceType === 'one_time') return;

  const all = await bills.query().fetch();
  const pending = all.filter(b => b.ruleId === rule.id && !b.isPaid && !b.isArchived);
  if (pending.length > 0) return;

  const lastBill = all
    .filter(b => b.ruleId === rule.id && b.isPaid)
    .sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime())[0];

  const baseDate = lastBill?.dueDate ?? new Date();
  const due = nextBillDueDate(baseDate, rule.recurrenceType, rule.recurrenceInterval);

  await database.write(async () => {
    await bills.create(bill => {
      bill.ruleId = rule.id;
      (bill as any)._raw.due_date = due.getTime();
      bill.isPaid = false;
      bill.amount = rule.defaultAmount;
      bill.isArchived = false;
      bill.createdBy = SYSTEM_USER;
      bill.updatedBy = SYSTEM_USER;
    });
  });
}

/** Auto-archive paid bills older than threshold */
export async function autoArchiveBills(thresholdDays: number | null): Promise<void> {
  if (thresholdDays === null) return;
  const cutoff = addDays(new Date(), -thresholdDays);
  const all = await bills.query().fetch();
  const toArchive = all.filter(
    b => b.isPaid && !b.isArchived && b.paidAt && isBefore(b.paidAt, cutoff)
  );
  if (toArchive.length === 0) return;
  await database.write(async () => {
    await Promise.all(toArchive.map(b => b.update(bill => {
      bill.isArchived = true;
      bill.updatedBy = SYSTEM_USER;
    })));
  });
}
