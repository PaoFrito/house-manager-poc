import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData, MarkedDates } from 'react-native-calendars';
import { useTheme } from '../../theme/ThemeContext';
import { Badge } from '../../components/UIKit';
import { tasks, taskRules, bills, billRules, inventory } from '../../db';
import { format, isSameDay } from 'date-fns';
import { useTranslation } from 'react-i18next';

type CalendarFilter = 'all' | 'bills' | 'tasks' | 'expiry';

interface CalEvent {
  date: Date;
  type: 'bill' | 'task' | 'expiry';
  title: string;
  id: string;
}

export const CalendarScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();

  const [filter, setFilter] = useState<CalendarFilter>('all');
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});

  const load = useCallback(async () => {
    const evs: CalEvent[] = [];

    if (filter === 'all' || filter === 'tasks') {
      const allTasks = await tasks.query().fetch();
      const allRules = await taskRules.query().fetch();
      const ruleMap = Object.fromEntries(allRules.map(r => [r.id, r]));
      allTasks.filter(t => !t.isArchived && !t.isSkipped).forEach(task => {
        const rule = ruleMap[task.ruleId];
        evs.push({
          date: task.dueDate,
          type: 'task',
          title: rule?.title ?? `Tarefa #${task.ruleId.slice(-4)}`,
          id: task.id,
        });
      });
    }

    if (filter === 'all' || filter === 'bills') {
      const allBills = await bills.query().fetch();
      const allRules = await billRules.query().fetch();
      const ruleMap = Object.fromEntries(allRules.map(r => [r.id, r]));
      allBills.filter(b => !b.isArchived && !b.isPaid).forEach(bill => {
        const rule = ruleMap[bill.ruleId];
        evs.push({
          date: bill.dueDate,
          type: 'bill',
          title: rule?.title ?? `Conta #${bill.ruleId.slice(-4)}`,
          id: bill.id,
        });
      });
    }

    if (filter === 'all' || filter === 'expiry') {
      const allInventory = await inventory.query().fetch();
      allInventory.filter(i => i.isPerishable && i.expirationDate).forEach(item => {
        evs.push({
          date: item.expirationDate!,
          type: 'expiry',
          title: `${item.name} expira`,
          id: item.id,
        });
      });
    }

    setEvents(evs);

    // Build marked dates
    const marks: MarkedDates = {};
    evs.forEach(ev => {
      const key = format(ev.date, 'yyyy-MM-dd');
      const dot = {
        bill: { color: theme.colors.brand.warning },
        task: { color: theme.colors.brand.primary },
        expiry: { color: theme.colors.brand.error },
      }[ev.type];

      if (!marks[key]) marks[key] = { dots: [] };
      (marks[key].dots as any[]).push(dot);
    });

    if (marks[selectedDay]) {
      marks[selectedDay].selected = true;
      marks[selectedDay].selectedColor = theme.colors.brand.primary + '40';
    } else {
      marks[selectedDay] = { selected: true, selectedColor: theme.colors.brand.primary + '40' };
    }

    setMarkedDates(marks);
  }, [filter, selectedDay, theme]);

  useEffect(() => { load(); }, [load]);

  const dayEvents = events.filter(ev => isSameDay(ev.date, new Date(selectedDay)));

  const FilterChip: React.FC<{ id: CalendarFilter; label: string }> = ({ id, label }) => (
    <TouchableOpacity
      style={[styles.chip, { backgroundColor: filter === id ? theme.colors.brand.primary : theme.colors.surface, borderColor: filter === id ? theme.colors.brand.primary : theme.colors.border }]}
      onPress={() => setFilter(id)}
    >
      <Text style={[styles.chipText, { color: filter === id ? '#fff' : theme.colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.bold }]}>
          {t('calendar.title')}
        </Text>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        <FilterChip id="all" label={t('calendar.filterAll')} />
        <FilterChip id="bills" label={t('calendar.filterBills')} />
        <FilterChip id="tasks" label={t('calendar.filterTasks')} />
        <FilterChip id="expiry" label={t('calendar.filterExpiry')} />
      </ScrollView>

      <Calendar
        markingType="multi-dot"
        markedDates={markedDates}
        onDayPress={(day: DateData) => setSelectedDay(day.dateString)}
        theme={{
          calendarBackground: theme.colors.background,
          dayTextColor: theme.colors.text,
          textDisabledColor: theme.colors.textMuted,
          monthTextColor: theme.colors.text,
          arrowColor: theme.colors.brand.primary,
          todayTextColor: theme.colors.brand.primary,
          selectedDayBackgroundColor: theme.colors.brand.primary,
          dotColor: theme.colors.brand.primary,
          backgroundColor: theme.colors.background,
        }}
      />

      {/* Day events */}
      <View style={[styles.dayEvents, { borderTopColor: theme.colors.border }]}>
        <Text style={[styles.dayTitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily.semiBold }]}>
          {selectedDay === format(new Date(), 'yyyy-MM-dd') ? t('common.today') : selectedDay}
        </Text>
        {dayEvents.length === 0 ? (
          <Text style={[styles.noEvents, { color: theme.colors.textMuted }]}>Nenhum evento neste dia</Text>
        ) : (
          dayEvents.map(ev => (
            <View key={ev.id} style={styles.eventRow}>
              <Badge
                label={ev.type === 'bill' ? '💰' : ev.type === 'task' ? '📋' : '⏳'}
                color={ev.type === 'bill' ? 'warning' : ev.type === 'task' ? 'primary' : 'error'}
              />
              <Text style={[styles.eventTitle, { color: theme.colors.text }]}>{ev.title}</Text>
            </View>
          ))
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  title: { fontSize: 26 },
  filters: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '500' },
  dayEvents: { flex: 1, padding: 16, borderTopWidth: 1 },
  dayTitle: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  noEvents: { fontSize: 14 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  eventTitle: { fontSize: 14 },
});
