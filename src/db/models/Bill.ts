import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';
import { RecurrenceType } from './Task';

export class BillRule extends Model {
  static table = 'tb_bill_rule';

  @field('title') title!: string;
  @field('category') category?: string;
  @field('is_high_priority') isHighPriority!: boolean;
  @field('recurrence_type') recurrenceType!: RecurrenceType;
  @field('recurrence_interval') recurrenceInterval!: number;
  @field('default_amount') defaultAmount!: number;
  @field('is_variable') isVariable!: boolean;
  @field('is_active') isActive!: boolean;
  @readonly date('created_at') createdAt!: Date;
  @readonly date('updated_at') updatedAt!: Date;
  @field('created_by') createdBy!: string;
  @field('updated_by') updatedBy!: string;
}

export class Bill extends Model {
  static table = 'tb_bill';

  @field('rule_id') ruleId!: string;
  @date('due_date') dueDate!: Date;
  @field('is_paid') isPaid!: boolean;
  @date('paid_at') paidAt?: Date;
  @field('amount') amount!: number;
  @field('is_archived') isArchived!: boolean;
  @readonly date('created_at') createdAt!: Date;
  @readonly date('updated_at') updatedAt!: Date;
  @field('created_by') createdBy!: string;
  @field('updated_by') updatedBy!: string;
}
