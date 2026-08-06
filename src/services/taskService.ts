import { database, taskRules, tasks } from '../db';
import { TaskRule, Task, RecurrenceType } from '../db/models/Task';
import { addDays, addWeeks, addMonths, startOfDay, isAfter, isBefore, isToday } from 'date-fns';

const SYSTEM_USER = 'system';

import { nextDueDate } from '../utils/dateUtils';
export { nextDueDate };

/** Generate the next task instance for a rule (if none pending) */
export async function generateNextTaskInstance(rule: TaskRule): Promise<void> {
  if (!rule.isActive) return;
  if (rule.recurrenceType === 'one_time') return;

  const existingTasks = await tasks
    .query()
    .fetch();

  const pending = existingTasks.filter(
    t => t.ruleId === rule.id && !t.isCompleted && !t.isSkipped && !t.isArchived
  );

  if (pending.length > 0) return; // already has a pending instance

  const lastCompleted = existingTasks
    .filter(t => t.ruleId === rule.id && t.isCompleted && !t.isArchived)
    .sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0))[0];

  const baseDate = lastCompleted?.completedAt ?? new Date();
  const due = nextDueDate(baseDate, rule.recurrenceType, rule.recurrenceInterval);

  await database.write(async () => {
    await tasks.create(task => {
      task.ruleId = rule.id;
      (task as any)._raw.due_date = due.getTime();
      task.isCompleted = false;
      task.isSnoozed = false;
      task.isSkipped = false;
      task.isArchived = false;
      task.createdBy = SYSTEM_USER;
      task.updatedBy = SYSTEM_USER;
    });
  });
}

/** Complete a task */
export async function completeTask(task: Task): Promise<void> {
  await database.write(async () => {
    await task.update(t => {
      t.isCompleted = true;
      (t as any)._raw.completed_at = Date.now();
      t.updatedBy = SYSTEM_USER;
    });
  });
}

/** Snooze a task by 1 day or 1 week */
export async function snoozeTask(task: Task, by: '1day' | '1week'): Promise<void> {
  const until = by === '1day' ? addDays(new Date(), 1) : addWeeks(new Date(), 1);
  await database.write(async () => {
    await task.update(t => {
      t.isSnoozed = true;
      (t as any)._raw.snooze_until = until.getTime();
      t.updatedBy = SYSTEM_USER;
    });
  });
}

/** Skip this instance of a task */
export async function skipTask(task: Task): Promise<void> {
  await database.write(async () => {
    await task.update(t => {
      t.isSkipped = true;
      t.updatedBy = SYSTEM_USER;
    });
  });
}

/** Calculate streak: how many of the last 7 days had at least one completion for a rule */
export async function calculateStreak(ruleId: string): Promise<boolean[]> {
  const allTasks = await tasks.query().fetch();
  const ruleTasks = allTasks.filter(t => t.ruleId === ruleId && t.isCompleted && t.completedAt);

  const last7: boolean[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = startOfDay(addDays(new Date(), -i));
    const nextDay = addDays(day, 1);
    const completed = ruleTasks.some(
      t => t.completedAt && isAfter(t.completedAt, day) && isBefore(t.completedAt, nextDay)
    );
    last7.push(completed);
  }
  return last7;
}

/** Get today's pending tasks */
export async function getTodayTasks(): Promise<Task[]> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = addDays(todayStart, 1);

  const all = await tasks.query().fetch();
  return all.filter(t =>
    !t.isCompleted &&
    !t.isSkipped &&
    !t.isArchived &&
    (!t.isSnoozed || (t.snoozeUntil && isBefore(t.snoozeUntil, now))) &&
    t.dueDate >= todayStart &&
    t.dueDate < todayEnd
  );
}

/** Get overdue tasks */
export async function getOverdueTasks(): Promise<Task[]> {
  const todayStart = startOfDay(new Date());
  const all = await tasks.query().fetch();
  return all.filter(t =>
    !t.isCompleted && !t.isSkipped && !t.isArchived && t.dueDate < todayStart
  );
}

/** Archive old completed tasks based on threshold (days) */
export async function autoArchiveTasks(thresholdDays: number | null): Promise<void> {
  if (thresholdDays === null) return;
  const cutoff = addDays(new Date(), -thresholdDays);
  const all = await tasks.query().fetch();
  const toArchive = all.filter(
    t => t.isCompleted && !t.isArchived && t.completedAt && isBefore(t.completedAt, cutoff)
  );

  if (toArchive.length === 0) return;
  await database.write(async () => {
    await Promise.all(toArchive.map(t => t.update(task => {
      task.isArchived = true;
      task.updatedBy = SYSTEM_USER;
    })));
  });
}
