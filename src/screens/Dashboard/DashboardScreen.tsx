import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../../components/Card';
import { Badge, FAB } from '../../components/UIKit';
import { getTodayTasks, getOverdueTasks } from '../../services/taskService';
import { getActiveBills, getOverdueBills, getMonthlyBudget } from '../../services/billService';
import { getLowStockItems, getExpiringItems } from '../../services/inventoryService';
import { Task } from '../../db/models/Task';
import { Bill } from '../../db/models/Bill';
import { Inventory } from '../../db/models/Inventory';
import { notes } from '../../db';
import { Note } from '../../db/models/Note';
import { format, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useSettingsStore } from '../../store/settingsStore';

const AttentionBanner: React.FC<{
  overdueTasks: number;
  overdueBills: number;
  lowStock: number;
  expiring: number;
  currency: string;
}> = ({ overdueTasks, overdueBills, lowStock, expiring, currency }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const total = overdueTasks + overdueBills + lowStock + expiring;

  if (total === 0) return null;

  const items = [
    overdueTasks > 0 && { label: `${overdueTasks} ${overdueTasks === 1 ? t('dashboard.overdueTask') : t('dashboard.overdueTasks')}`, color: 'error' as const, icon: 'time-outline' as const },
    overdueBills > 0 && { label: `${overdueBills} ${overdueBills === 1 ? t('dashboard.overdueBill') : t('dashboard.overdueBills')}`, color: 'warning' as const, icon: 'wallet-outline' as const },
    lowStock > 0 && { label: `${lowStock} ${lowStock === 1 ? t('dashboard.lowStockItem') : t('dashboard.lowStockItems')}`, color: 'info' as const, icon: 'cube-outline' as const },
    expiring > 0 && { label: `${expiring} ${expiring === 1 ? t('dashboard.expiringItem') : t('dashboard.expiringItems_plural')}`, color: 'warning' as const, icon: 'alert-circle-outline' as const },
  ].filter(Boolean) as Array<{ label: string; color: 'error' | 'warning' | 'info'; icon: any }>;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => setExpanded(!expanded)}
      style={[
        styles.banner,
        { backgroundColor: theme.colors.brand.error + '18', borderColor: theme.colors.brand.error + '50' },
      ]}
    >
      <View style={styles.bannerHeader}>
        <View style={styles.bannerLeft}>
          <Ionicons name="warning" size={18} color={theme.colors.brand.error} />
          <Text style={[styles.bannerTitle, { color: theme.colors.brand.error }]}>
            {t('dashboard.attentionRequired')} ({total})
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.colors.brand.error}
        />
      </View>
      {expanded && (
        <View style={styles.bannerItems}>
          {items.map((item, i) => (
            <View key={i} style={styles.bannerItem}>
              <Ionicons name={item.icon} size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.bannerItemText, { color: theme.colors.textSecondary }]}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

export const DashboardScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const currency = useSettingsStore(s => s.currency);

  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [upcomingBills, setUpcomingBills] = useState<Bill[]>([]);
  const [overdueBills, setOverdueBills] = useState<Bill[]>([]);
  const [lowStock, setLowStock] = useState<Inventory[]>([]);
  const [expiring, setExpiring] = useState<Inventory[]>([]);
  const [pinnedNotes, setPinnedNotes] = useState<Note[]>([]);
  const [budget, setBudget] = useState({ spent: 0, paid: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [tt, ot, ab, ob, ls, ex, mn] = await Promise.all([
      getTodayTasks(),
      getOverdueTasks(),
      getActiveBills(),
      getOverdueBills(),
      getLowStockItems(),
      getExpiringItems(7),
      getMonthlyBudget(),
    ]);
    setTodayTasks(tt);
    setOverdueTasks(ot);
    setUpcomingBills(ab.slice(0, 3));
    setOverdueBills(ob);
    setLowStock(ls);
    setExpiring(ex);
    setBudget(mn);

    const allNotes = await notes.query().fetch();
    setPinnedNotes(allNotes.filter(n => n.isPinned || n.isHighPriority).slice(0, 3));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const formatDate = (date: Date) => {
    if (isToday(date)) return t('common.today');
    if (isTomorrow(date)) return t('common.tomorrow');
    return format(date, 'dd/MM', { locale: ptBR });
  };

  const s = styles;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.brand.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={[s.greeting, { color: theme.colors.textMuted, fontFamily: theme.typography.fontFamily.regular }]}>
              {new Date().getHours() < 12 ? 'Bom dia 👋' : new Date().getHours() < 18 ? 'Boa tarde 👋' : 'Boa noite 👋'}
            </Text>
            <Text style={[s.title, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.bold }]}>
              Casa Manager
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <View style={[s.notifBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Ionicons name="notifications-outline" size={22} color={theme.colors.icon} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Attention Banner */}
        <AttentionBanner
          overdueTasks={overdueTasks.length}
          overdueBills={overdueBills.length}
          lowStock={lowStock.length}
          expiring={expiring.length}
          currency={currency}
        />

        {/* Budget Summary */}
        <Card style={{ marginTop: 16, marginBottom: 4 }}>
          <View style={s.budgetRow}>
            <View>
              <Text style={[s.budgetLabel, { color: theme.colors.textMuted }]}>Gasto este mês</Text>
              <Text style={[s.budgetAmount, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.bold }]}>
                {currency} {budget.spent.toFixed(2)}
              </Text>
            </View>
            <View style={[s.budgetChip, { backgroundColor: theme.colors.brand.success + '20' }]}>
              <Ionicons name="trending-up-outline" size={16} color={theme.colors.brand.success} />
              <Text style={[s.budgetChipText, { color: theme.colors.brand.success }]}>
                Pago: {currency} {budget.paid.toFixed(2)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Today's Tasks */}
        <SectionHeader
          title={t('dashboard.todayTasks')}
          onViewAll={() => navigation.navigate('Tasks')}
          theme={theme}
          t={t}
        />
        <Card>
          {todayTasks.length === 0 ? (
            <Text style={[s.emptyText, { color: theme.colors.textMuted }]}>{t('dashboard.noTasksToday')}</Text>
          ) : (
            todayTasks.slice(0, 4).map(task => (
              <DashboardTaskRow key={task.id} task={task} theme={theme} onReload={load} />
            ))
          )}
        </Card>

        {/* Upcoming Bills */}
        <SectionHeader
          title={t('dashboard.upcomingBills')}
          onViewAll={() => navigation.navigate('Finance')}
          theme={theme}
          t={t}
        />
        <Card>
          {upcomingBills.length === 0 ? (
            <Text style={[s.emptyText, { color: theme.colors.textMuted }]}>{t('dashboard.noBillsDue')}</Text>
          ) : (
            upcomingBills.map(bill => (
              <View key={bill.id} style={s.billRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.billTitle, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.medium }]}>
                    Conta #{bill.ruleId.slice(-4)}
                  </Text>
                  <Text style={[s.billDate, { color: theme.colors.textMuted }]}>
                    {formatDate(bill.dueDate)}
                  </Text>
                </View>
                <Text style={[s.billAmount, { color: theme.colors.brand.warning, fontFamily: theme.typography.fontFamily.semiBold }]}>
                  {currency} {bill.amount.toFixed(2)}
                </Text>
              </View>
            ))
          )}
        </Card>

        {/* Pinned Notes */}
        {pinnedNotes.length > 0 && (
          <>
            <SectionHeader
              title={t('dashboard.pinnedNotes')}
              onViewAll={() => navigation.navigate('Notes')}
              theme={theme}
              t={t}
            />
            {pinnedNotes.map(note => (
              <Card key={note.id} style={{ marginBottom: 8 }}>
                <View style={s.noteRow}>
                  <Ionicons name="pin" size={14} color={theme.colors.brand.secondary} style={{ marginRight: 6 }} />
                  <Text style={[s.noteTitle, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.medium, flex: 1 }]} numberOfLines={1}>
                    {note.title}
                  </Text>
                </View>
                <Text style={[s.notePreview, { color: theme.colors.textSecondary }]} numberOfLines={2}>
                  {note.content}
                </Text>
              </Card>
            ))}
          </>
        )}

        {/* Expiring Items */}
        {expiring.length > 0 && (
          <>
            <SectionHeader
              title={t('dashboard.expiringItems')}
              onViewAll={() => navigation.navigate('Inventory')}
              theme={theme}
              t={t}
            />
            <Card>
              {expiring.slice(0, 3).map(item => (
                <View key={item.id} style={s.expiryRow}>
                  <Text style={[s.expiryName, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.medium }]}>
                    {item.name}
                  </Text>
                  <Badge
                    label={item.expirationDate ? format(item.expirationDate, 'dd/MM') : ''}
                    color="warning"
                  />
                </View>
              ))}
            </Card>
          </>
        )}
      </ScrollView>

      <FAB onPress={() => navigation.navigate('QuickAdd')} />
    </SafeAreaView>
  );
};

// ---- Helpers ----

const SectionHeader: React.FC<{ title: string; onViewAll: () => void; theme: any; t: any }> = ({
  title, onViewAll, theme, t
}) => (
  <View style={styles.sectionHeader}>
    <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.semiBold }]}>
      {title}
    </Text>
    <TouchableOpacity onPress={onViewAll}>
      <Text style={[styles.viewAll, { color: theme.colors.brand.primary }]}>{t('dashboard.viewAll')}</Text>
    </TouchableOpacity>
  </View>
);

const DashboardTaskRow: React.FC<{ task: Task; theme: any; onReload: () => void }> = ({ task, theme, onReload }) => (
  <View style={styles.taskRow}>
    <View style={[styles.taskDot, { backgroundColor: task.isCompleted ? theme.colors.brand.success : theme.colors.brand.primary }]} />
    <Text
      style={[
        styles.taskTitle,
        {
          color: task.isCompleted ? theme.colors.textMuted : theme.colors.text,
          fontFamily: theme.typography.fontFamily.regular,
          textDecorationLine: task.isCompleted ? 'line-through' : 'none',
        },
      ]}
      numberOfLines={1}
    >
      Tarefa #{task.ruleId.slice(-4)}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  greeting: { fontSize: 13, marginBottom: 2 },
  title: { fontSize: 24 },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  banner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bannerTitle: { fontSize: 14, fontWeight: '600' },
  bannerItems: { marginTop: 10, gap: 6 },
  bannerItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bannerItemText: { fontSize: 13 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 17 },
  viewAll: { fontSize: 13, fontWeight: '500' },
  emptyText: { fontSize: 14, textAlign: 'center', paddingVertical: 8 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  taskDot: { width: 8, height: 8, borderRadius: 4 },
  taskTitle: { fontSize: 14, flex: 1 },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  billTitle: { fontSize: 14 },
  billDate: { fontSize: 12, marginTop: 2 },
  billAmount: { fontSize: 15 },
  noteRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  noteTitle: { fontSize: 15 },
  notePreview: { fontSize: 13, lineHeight: 18 },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  expiryName: { fontSize: 14 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetLabel: { fontSize: 12, marginBottom: 4 },
  budgetAmount: { fontSize: 22 },
  budgetChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  budgetChipText: { fontSize: 12, fontWeight: '600' },
});
