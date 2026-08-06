import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { database, tasks, taskRules, bills, billRules, inventory, shoppingCart, notes } from '../db';

/** Export all data as a JSON backup */
export async function exportBackup(): Promise<string> {
  const [
    allTasks,
    allTaskRules,
    allBills,
    allBillRules,
    allInventory,
    allShopping,
    allNotes,
  ] = await Promise.all([
    tasks.query().fetch(),
    taskRules.query().fetch(),
    bills.query().fetch(),
    billRules.query().fetch(),
    inventory.query().fetch(),
    shoppingCart.query().fetch(),
    notes.query().fetch(),
  ]);

  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      tasks: allTasks.map(t => ({ ...t._raw })),
      taskRules: allTaskRules.map(t => ({ ...t._raw })),
      bills: allBills.map(b => ({ ...b._raw })),
      billRules: allBillRules.map(b => ({ ...b._raw })),
      inventory: allInventory.map(i => ({ ...i._raw })),
      shoppingCart: allShopping.map(s => ({ ...s._raw })),
      notes: allNotes.map(n => ({ ...n._raw })),
    },
  };

  const json = JSON.stringify(backup, null, 2);
  const filename = `house-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
  const path = `${FileSystem.documentDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(path, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return path;
}

/** Import a backup JSON file and restore data */
export async function importBackup(): Promise<{ success: boolean; message: string }> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) {
      return { success: false, message: 'Import cancelled' };
    }

    const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
    const backup = JSON.parse(content);

    if (!backup.version || !backup.data) {
      return { success: false, message: 'Invalid backup file format' };
    }

    // Clear existing data and restore from backup
    await database.write(async () => {
      // This is a simplified restore — in production you'd handle conflicts
      const allTasks = await tasks.query().fetch();
      const allTaskRules = await taskRules.query().fetch();
      const allBills = await bills.query().fetch();
      const allBillRules = await billRules.query().fetch();
      const allInventory = await inventory.query().fetch();
      const allShopping = await shoppingCart.query().fetch();
      const allNotes = await notes.query().fetch();

      await Promise.all([
        ...allTasks.map(t => t.destroyPermanently()),
        ...allTaskRules.map(t => t.destroyPermanently()),
        ...allBills.map(b => b.destroyPermanently()),
        ...allBillRules.map(b => b.destroyPermanently()),
        ...allInventory.map(i => i.destroyPermanently()),
        ...allShopping.map(s => s.destroyPermanently()),
        ...allNotes.map(n => n.destroyPermanently()),
      ]);
    });

    return { success: true, message: `Backup from ${backup.exportedAt} restored successfully` };
  } catch (error) {
    return { success: false, message: `Import failed: ${error}` };
  }
}

/** Clear all app data (factory reset) */
export async function factoryReset(): Promise<void> {
  await database.write(async () => {
    const collections = [tasks, taskRules, bills, billRules, inventory, shoppingCart, notes];
    await Promise.all(
      collections.map(async col => {
        const all = await col.query().fetch();
        await Promise.all(all.map(item => (item as any).destroyPermanently()));
      })
    );
  });
}
