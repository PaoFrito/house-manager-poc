import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class User extends Model {
  static table = 'users';

  @field('name') _name!: string;

  get name(): string {
    return this._name || 'PaoFrito';
  }

  set name(value: string) {
    this._name = value;
  }
  @field('email') email?: string;
  @field('password_hash') passwordHash?: string;
  @readonly date('created_at') createdAt!: Date;
  @readonly date('updated_at') updatedAt!: Date;
  @field('created_by') createdBy!: string;
  @field('updated_by') updatedBy!: string;
}
