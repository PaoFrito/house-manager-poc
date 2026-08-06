import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../../components/Card';
import { Badge, EmptyState, FAB } from '../../components/UIKit';
import { bills, billRules } from '../../db';
import { Bill } from '../../db/models/Bill';
import { BillRule } from '../../db/models/Bill';
import { markBillPaid, archiveBill, getMonthlyBudget } from '../../services/billService';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useSettingsStore } from '../../store/settingsStore';

type FinanceTab = 'bills' | 'budget' | 'archived';

export const FinanceScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const currency = useSettingsStore(s => s.currency);

  const [activeTab, setActiveTab] = useState<FinanceTab>('bills');
  const [billList, setBillList] = useState<Bill[]>([]);
  const [rules, setRules] = useState<Record<string, BillRule>>({});
  const [budget, setBudget] = useState({ spent: 0, paid: 0 });
  const [monthlyIncome, setMonthlyIncome] = useState(0);

  const load = useCallback(async () => {
    const allBills = await bills.query().fetch();
    const allRules = await billRules.query().fetch();
    const ruleMap: Record<string, BillRule> = {};
    allRules.forEach(r => (ruleMap[r.id] = r));
    setRules(ruleMap);
    setBillList(allBills.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()));
    setBudget(await getMonthlyBudget());
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeBills = billList.filter(b => !b.isPaid && !b.isArchived);
  const archivedBills = billList.filter(b => b.isArchived || b.isPaid);
  const isOverspending = monthlyIncome > 0 && budget.spent > monthlyIncome;

  const handleMarkPaid = async (bill: Bill) => {
    Alert.alert(t('common.markAsPaid'), `${t('finance.amount')}: ${currency} ${bill.amount.toFixed(2)}`, [
      {
        text: t('common.confirm'),
        onPress: async () => { await markBillPaid(bill); load(); },
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const formatDue = (date: Date) => {
    if (isToday(date)) return t('common.today');
    if (isTomorrow(date)) return t('common.tomorrow');
    if (isPast(date)) return `⚠ ${t('common.overdue')}`;
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  const Tab: React.FC<{ id: FinanceTab; label: string }> = ({ id, label }) => (
    <TouchableOpacity
      style={[styles.tab, activeTab === id && { borderBottomColor: theme.colors.brand.primary, borderBottomWidth: 2 }]}
      onPress={() => setActiveTab(id)}
    >
      <Text style={[styles.tabText, { color: activeTab === id ? theme.colors.brand.primary : theme.colors.textMuted }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.bold }]}>
          {t('finance.title')}
        </Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: theme.colors.border }]}>
        <Tab id="bills" label={t('finance.bills')} />
        <Tab id="budget" label={t('finance.budget')} />
        <Tab id="archived" label={t('finance.archivedBills')} />
      </View>

      {activeTab === 'bills' && (
        <>
          <FlatList
            data={activeBills}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 12 }}
            renderItem={({ item }) => {
              const rule = rules[item.ruleId];
              const overdue = isPast(item.dueDate);
              return (
                <Card style={{ marginBottom: 10 }}>
                  <View style={styles.billRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.billTitle, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.medium }]}>
                        {rule?.title ?? `Conta #${item.ruleId.slice(-4)}`}
                      </Text>
                      <View style={styles.metaRow}>
                        {rule?.category && <Badge label={rule.category} color="muted" />}
                        {rule?.isVariable && <Badge label="Variável" color="info" />}
                        <Text style={[styles.dueText, { color: overdue ? theme.colors.brand.error : theme.colors.textMuted }]}>
                          {formatDue(item.dueDate)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.billRight}>
                      <Text style={[styles.billAmount, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.bold }]}>
                        {currency} {item.amount.toFixed(2)}
                      </Text>
                      <TouchableOpacity
                        style={[styles.payBtn, { backgroundColor: theme.colors.brand.success + '20', borderColor: theme.colors.brand.success + '50' }]}
                        onPress={() => handleMarkPaid(item)}
                      >
                        <Ionicons name="checkmark-circle-outline" size={14} color={theme.colors.brand.success} />
                        <Text style={[styles.payBtnText, { color: theme.colors.brand.success }]}>{t('common.paid')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              );
            }}
            ListEmptyComponent={
              <EmptyState
                icon="wallet-outline"
                title="Nenhuma conta pendente"
                action={{ label: t('finance.newBill'), onPress: () => navigation.navigate('BillForm') }}
              />
            }
          />
          <FAB onPress={() => navigation.navigate('BillForm')} />
        </>
      )}

      {activeTab === 'budget' && (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {isOverspending && (
            <Card style={{ marginBottom: 12, borderColor: theme.colors.brand.error + '60' }}>
              <Text style={{ color: theme.colors.brand.error, fontWeight: '600' }}>{t('finance.overspending')}</Text>
            </Card>
          )}

          <Card title={t('finance.monthlyIncome')} style={{ marginBottom: 12 }}>
            <Text style={[styles.bigAmount, { color: theme.colors.brand.success, fontFamily: theme.typography.fontFamily.bold }]}>
              {currency} {monthlyIncome.toFixed(2)}
            </Text>
          </Card>

          <Card title={t('finance.totalSpent')} style={{ marginBottom: 12 }}>
            <Text style={[styles.bigAmount, { color: theme.colors.brand.error, fontFamily: theme.typography.fontFamily.bold }]}>
              {currency} {budget.spent.toFixed(2)}
            </Text>
          </Card>

          <Card title={t('finance.remaining')}>
            <Text style={[styles.bigAmount, {
              color: monthlyIncome - budget.spent >= 0 ? theme.colors.brand.success : theme.colors.brand.error,
              fontFamily: theme.typography.fontFamily.bold,
            }]}>
              {currency} {(monthlyIncome - budget.spent).toFixed(2)}
            </Text>
          </Card>
        </ScrollView>
      )}

      {activeTab === 'archived' && (
        <FlatList
          data={archivedBills}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 12 }}
          renderItem={({ item }) => {
            const rule = rules[item.ruleId];
            return (
              <Card style={{ marginBottom: 10, opacity: 0.75 }}>
                <View style={styles.billRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.billTitle, { color: theme.colors.textSecondary }]}>
                      {rule?.title ?? `Conta #${item.ruleId.slice(-4)}`}
                    </Text>
                    <Text style={[styles.dueText, { color: theme.colors.textMuted }]}>
                      {item.paidAt ? `${t('finance.paidOn')} ${format(item.paidAt, 'dd/MM/yyyy')}` : t('common.archived')}
                    </Text>
                  </View>
                  <Text style={[styles.billAmount, { color: theme.colors.textMuted }]}>
                    {currency} {item.amount.toFixed(2)}
                  </Text>
                </View>
              </Card>
            );
          }}
          ListEmptyComponent={
            <EmptyState icon="archive-outline" title="Nenhuma conta arquivada" />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 26 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 16 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: 13, fontWeight: '600' },
  billRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  billTitle: { fontSize: 15 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'wrap' },
  dueText: { fontSize: 12 },
  billRight: { alignItems: 'flex-end', gap: 8 },
  billAmount: { fontSize: 16 },
  payBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  payBtnText: { fontSize: 12, fontWeight: '600' },
  bigAmount: { fontSize: 28, marginTop: 4 },
});
