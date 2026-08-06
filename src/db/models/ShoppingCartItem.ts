import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class ShoppingCartItem extends Model {
  static table = 'tb_shopping_cart_item';

  @field('inventory_id') inventoryId?: string;
  @field('name') name!: string;
  @field('category') category?: string;
  @field('estimated_cost') estimatedCost!: number;
  @field('is_bought') isBought!: boolean;
  @date('bought_at') boughtAt?: Date;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  @field('created_by') createdBy!: string;
  @field('updated_by') updatedBy!: string;
}
