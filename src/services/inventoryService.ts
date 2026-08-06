import { database, inventory, shoppingCart } from '../db';
import { Inventory, InventoryStatus } from '../db/models/Inventory';
import { ShoppingCartItem } from '../db/models/ShoppingCartItem';
import { addDays, isBefore } from 'date-fns';

const SYSTEM_USER = 'system';

/** Update inventory item status */
export async function updateInventoryStatus(item: Inventory, status: InventoryStatus): Promise<void> {
  await database.write(async () => {
    await item.update(i => {
      i.status = status;
      i.updatedBy = SYSTEM_USER;
    });
  });
}

/** Add inventory item to shopping list */
export async function addInventoryToShoppingList(item: Inventory): Promise<ShoppingCartItem> {
  return database.write(async () => {
    return shoppingCart.create(cartItem => {
      cartItem.inventoryId = item.id;
      cartItem.name = item.name;
      cartItem.category = item.category;
      cartItem.estimatedCost = 0;
      cartItem.isBought = false;
      cartItem.createdBy = SYSTEM_USER;
      cartItem.updatedBy = SYSTEM_USER;
    });
  });
}

/** Get items with low/empty status */
export async function getLowStockItems(): Promise<Inventory[]> {
  const all = await inventory.query().fetch();
  return all.filter(i => i.status === 'LOW' || i.status === 'EMPTY');
}

/** Get items expiring within N days */
export async function getExpiringItems(withinDays = 7): Promise<Inventory[]> {
  const cutoff = addDays(new Date(), withinDays);
  const all = await inventory.query().fetch();
  return all.filter(i => i.isPerishable && i.expirationDate && isBefore(i.expirationDate, cutoff));
}

/** Check if a shopping list item matches an existing inventory item (duplicate check) */
export async function checkDuplicateInInventory(name: string): Promise<Inventory | null> {
  const all = await inventory.query().fetch();
  const match = all.find(
    i => i.name.toLowerCase().trim() === name.toLowerCase().trim()
  );
  return match ?? null;
}

/** When a shopping item is marked as bought, update linked inventory to IN_STOCK */
export async function restockFromShoppingItem(cartItem: ShoppingCartItem): Promise<void> {
  if (!cartItem.inventoryId) return;

  const allInventory = await inventory.query().fetch();
  const item = allInventory.find(i => i.id === cartItem.inventoryId);
  if (!item) return;

  await database.write(async () => {
    await item.update(i => {
      i.status = 'IN_STOCK';
      i.updatedBy = SYSTEM_USER;
    });
    await cartItem.update(c => {
      c.isBought = true;
      (c as any)._raw.bought_at = Date.now();
      c.updatedBy = SYSTEM_USER;
    });
  });
}
