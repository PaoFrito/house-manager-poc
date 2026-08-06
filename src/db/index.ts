import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import schema from './schema';
import migrations from './migrations';
import { User } from './models/User';
import { TaskRule, Task } from './models/Task';
import { BillRule, Bill } from './models/Bill';
import { Inventory } from './models/Inventory';
import { ShoppingCartItem } from './models/ShoppingCartItem';
import { Note } from './models/Note';

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  dbName: 'house_manager',
  jsi: true, // use JSI for better performance
  onSetUpError: (error) => {
    console.error('WatermelonDB setup error:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [
    User,
    TaskRule,
    Task,
    BillRule,
    Bill,
    Inventory,
    ShoppingCartItem,
    Note,
  ],
});

// Convenience collection accessors
export const users = database.get<User>('users');
export const taskRules = database.get<TaskRule>('tb_task_rule');
export const tasks = database.get<Task>('tb_task');
export const billRules = database.get<BillRule>('tb_bill_rule');
export const bills = database.get<Bill>('tb_bill');
export const inventory = database.get<Inventory>('tb_inventory');
export const shoppingCart = database.get<ShoppingCartItem>('tb_shopping_cart_item');
export const notes = database.get<Note>('tb_notes');
