import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class Note extends Model {
  static table = 'tb_notes';

  @field('title') title!: string;
  @field('content') content!: string;
  @field('is_pinned') isPinned!: boolean;
  @field('is_high_priority') isHighPriority!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  @field('created_by') createdBy!: string;
  @field('updated_by') updatedBy!: string;
}
