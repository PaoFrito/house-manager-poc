import { appSchema, tableSchema } from '@nozbe/watermelondb';

// Common audit fields shared by all tables
const auditFields = [
  { name: 'created_at', type: 'number' as const },
  { name: 'updated_at', type: 'number' as const },
  { name: 'created_by', type: 'string' as const },
  { name: 'updated_by', type: 'string' as const },
];

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'users',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'email', type: 'string', isOptional: true },
        { name: 'password_hash', type: 'string', isOptional: true },
        ...auditFields,
      ],
    }),

    tableSchema({
      name: 'tb_user_preferences',
      columns: [
        { name: 'user_id', type: 'string' },
        { name: 'monthly_income', type: 'number' },
        { name: 'currency_type', type: 'string' },
        { name: 'time_format', type: 'string' },
        { name: 'timezone', type: 'string' },
        { name: 'theme', type: 'string' },
        { name: 'language', type: 'string' },
        ...auditFields,
      ],
    }),

    // ---- Task rule (recurring template) ----
    tableSchema({
      name: 'tb_task_rule',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'category', type: 'string', isOptional: true },
        { name: 'is_high_priority', type: 'boolean' },
        { name: 'recurrence_type', type: 'string' }, // daily | weekly | monthly | every_x_days
        { name: 'recurrence_interval', type: 'number' }, // X in "every X days"
        { name: 'is_active', type: 'boolean' },
        ...auditFields,
      ],
    }),

    // ---- Task instance ----
    tableSchema({
      name: 'tb_task',
      columns: [
        { name: 'rule_id', type: 'string' },
        { name: 'due_date', type: 'number' },         // timestamp ms
        { name: 'is_completed', type: 'boolean' },
        { name: 'completed_at', type: 'number', isOptional: true },
        { name: 'is_snoozed', type: 'boolean' },
        { name: 'snooze_until', type: 'number', isOptional: true },
        { name: 'is_skipped', type: 'boolean' },
        { name: 'is_archived', type: 'boolean' },
        ...auditFields,
      ],
    }),

    // ---- Bill rule (recurring template) ----
    tableSchema({
      name: 'tb_bill_rule',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'category', type: 'string', isOptional: true },
        { name: 'is_high_priority', type: 'boolean' },
        { name: 'recurrence_type', type: 'string' }, // one_time | monthly | weekly | every_x_days
        { name: 'recurrence_interval', type: 'number' },
        { name: 'default_amount', type: 'number' },
        { name: 'is_variable', type: 'boolean' },
        { name: 'is_active', type: 'boolean' },
        ...auditFields,
      ],
    }),

    // ---- Bill instance ----
    tableSchema({
      name: 'tb_bill',
      columns: [
        { name: 'rule_id', type: 'string' },
        { name: 'due_date', type: 'number' },
        { name: 'is_paid', type: 'boolean' },
        { name: 'paid_at', type: 'number', isOptional: true },
        { name: 'amount', type: 'number' },
        { name: 'is_archived', type: 'boolean' },
        ...auditFields,
      ],
    }),

    // ---- Inventory ----
    tableSchema({
      name: 'tb_inventory',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'category', type: 'string', isOptional: true },
        { name: 'status', type: 'string' },           // IN_STOCK | LOW | EMPTY
        { name: 'is_perishable', type: 'boolean' },
        { name: 'expiration_date', type: 'number', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        ...auditFields,
      ],
    }),

    // ---- Shopping cart item ----
    tableSchema({
      name: 'tb_shopping_cart_item',
      columns: [
        { name: 'inventory_id', type: 'string', isOptional: true },
        { name: 'name', type: 'string' },
        { name: 'category', type: 'string', isOptional: true },
        { name: 'estimated_cost', type: 'number' },
        { name: 'is_bought', type: 'boolean' },
        { name: 'bought_at', type: 'number', isOptional: true },
        ...auditFields,
      ],
    }),

    // ---- Notes ----
    tableSchema({
      name: 'tb_notes',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'is_pinned', type: 'boolean' },
        { name: 'is_high_priority', type: 'boolean' },
        ...auditFields,
      ],
    }),
  ],
});
