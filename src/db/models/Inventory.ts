import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export type InventoryStatus = 'IN_STOCK' | 'LOW' | 'EMPTY';

export class Inventory extends Model {
  static table = 'tb_inventory';

  @field('name') name!: string;
  @field('category') category?: string;
  @field('status') status!: InventoryStatus;
  @field('is_perishable') isPerishable!: boolean;
  @date('expiration_date') expirationDate?: Date;
  @field('notes') notes?: string;
  @readonly date('created_at') createdAt!: Date;
  @readonly date('updated_at') updatedAt!: Date;
  @field('created_by') createdBy!: string;
  @field('updated_by') updatedBy!: string;
}
