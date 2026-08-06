import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'every_x_days' | 'one_time';

export class TaskRule extends Model {
  static table = 'tb_task_rule';

  @field('title') title!: string;
  @field('category') category?: string;
  @field('is_high_priority') isHighPriority!: boolean;
  @field('recurrence_type') recurrenceType!: RecurrenceType;
  @field('recurrence_interval') recurrenceInterval!: number;
  @field('is_active') isActive!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  @field('created_by') createdBy!: string;
  @field('updated_by') updatedBy!: string;
}

export class Task extends Model {
  static table = 'tb_task';

  @field('rule_id') ruleId!: string;
  @date('due_date') dueDate!: Date;
  @field('is_completed') isCompleted!: boolean;
  @date('completed_at') completedAt?: Date;
  @field('is_snoozed') isSnoozed!: boolean;
  @date('snooze_until') snoozeUntil?: Date;
  @field('is_skipped') isSkipped!: boolean;
  @field('is_archived') isArchived!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  @field('created_by') createdBy!: string;
  @field('updated_by') updatedBy!: string;
}
