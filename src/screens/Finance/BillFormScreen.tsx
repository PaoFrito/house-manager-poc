import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { database, billRules, bills } from '../../db';
import { RecurrenceType } from '../../db/models/Task';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { addDays, addMonths } from 'date-fns';

const RECURRENCE_OPTIONS: Array<{ label: string; value: RecurrenceType }> = [
  { label: 'Única', value: 'one_time' },
  { label: 'Mensal', value: 'monthly' },
  { label: 'Semanal', value: 'weekly' },
  { label: 'A cada X dias', value: 'every_x_days' },
];

const CATEGORIES = ['Fixa', 'Variável', 'Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Lazer'];

export const BillFormScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Fixa');
  const [amount, setAmount] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('monthly');
  const [interval, setInterval] = useState('1');
  const [isVariable, setIsVariable] = useState(false);
  const [isHighPriority, setIsHighPriority] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Campo obrigatório', 'Informe o nome da conta.');
      return;
    }
    const parsedAmount = parseFloat(amount.replace(',', '.')) || 0;

    setLoading(true);
    try {
      const userId = 'local-user';
      await database.write(async () => {
        const rule = await billRules.create(r => {
          r.title = title.trim();
          r.category = category;
          r.isHighPriority = isHighPriority;
          r.recurrenceType = recurrence;
          r.recurrenceInterval = parseInt(interval) || 1;
          r.defaultAmount = parsedAmount;
          r.isVariable = isVariable;
          r.isActive = true;
          r.createdBy = userId;
          r.updatedBy = userId;
        });

        // Create initial bill instance
        const dueDate = recurrence === 'monthly' ? addMonths(new Date(), 1) : addDays(new Date(), 30);
        await bills.create(bill => {
          bill.ruleId = rule.id;
          (bill as any)._raw.due_date = dueDate.getTime();
          bill.isPaid = false;
          bill.amount = parsedAmount;
          bill.isArchived = false;
          bill.createdBy = userId;
          bill.updatedBy = userId;
        });
      });

      navigation.goBack();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar a conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.bold }]}>
          {t('finance.newBill')}
        </Text>

        <Input
          label={t('finance.billName')}
          value={title}
          onChangeText={setTitle}
          placeholder="Ex: Luz, Internet, Condomínio"
          autoFocus
        />

        <Input
          label={t('finance.amount')}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="0.00"
        />

        <Text style={[styles.label, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily.medium }]}>
          {t('finance.category')}
        </Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map(cat => (
            <Button
              key={cat}
              title={cat}
              onPress={() => setCategory(cat)}
              variant={category === cat ? 'primary' : 'secondary'}
              size="sm"
              style={{ marginRight: 8, marginBottom: 8 }}
            />
          ))}
        </View>

        <Text style={[styles.label, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily.medium }]}>
          {t('tasks.recurrence')}
        </Text>
        <View style={styles.chipRow}>
          {RECURRENCE_OPTIONS.map(opt => (
            <Button
              key={opt.value}
              title={opt.label}
              onPress={() => setRecurrence(opt.value)}
              variant={recurrence === opt.value ? 'primary' : 'secondary'}
              size="sm"
              style={{ marginRight: 8, marginBottom: 8 }}
            />
          ))}
        </View>

        <View style={[styles.switchRow, { borderTopColor: theme.colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.switchLabel, { color: theme.colors.text }]}>{t('finance.variable')}</Text>
            <Text style={[styles.switchHint, { color: theme.colors.textMuted }]}>O valor pode mudar a cada mês</Text>
          </View>
          <Switch
            value={isVariable}
            onValueChange={setIsVariable}
            trackColor={{ true: theme.colors.brand.primary }}
            thumbColor="#fff"
          />
        </View>

        <View style={{ marginTop: 24, gap: 10 }}>
          <Button title={t('common.save')} onPress={handleSave} loading={loading} size="lg" />
          <Button title={t('common.cancel')} onPress={() => navigation.goBack()} variant="ghost" size="lg" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 24, marginBottom: 24 },
  label: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, marginTop: 8 },
  switchLabel: { fontSize: 15, fontWeight: '500' },
  switchHint: { fontSize: 12, marginTop: 2 },
});
