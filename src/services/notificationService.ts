import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { addDays, setHours, setMinutes } from 'date-fns';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/** Request notification permissions */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Padrão',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** Schedule daily morning digest */
export async function scheduleDailyDigest(time: string): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const [hours, minutes] = time.split(':').map(Number);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🏠 House Manager — Resumo do Dia',
      body: 'Toque para ver suas tarefas e contas de hoje.',
      data: { type: 'daily_digest' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    },
  });
}

/** Schedule a task reminder */
export async function scheduleTaskReminder(
  taskId: string,
  title: string,
  dueDate: Date,
  hoursBeforeAmt = 2
): Promise<string> {
  const triggerDate = addDays(dueDate, 0);
  triggerDate.setHours(triggerDate.getHours() - hoursBeforeAmt);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `📋 Tarefa: ${title}`,
      body: 'Esta tarefa vence em breve!',
      data: { type: 'task_reminder', taskId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
  return id;
}

/** Schedule a bill reminder */
export async function scheduleBillReminder(
  billId: string,
  title: string,
  amount: number,
  dueDate: Date
): Promise<string> {
  const dayBefore = addDays(dueDate, -1);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `💰 Conta: ${title}`,
      body: `Vence amanhã — R$ ${amount.toFixed(2)}`,
      data: { type: 'bill_reminder', billId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: dayBefore,
    },
  });
  return id;
}

/** Cancel a specific notification */
export async function cancelNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}
