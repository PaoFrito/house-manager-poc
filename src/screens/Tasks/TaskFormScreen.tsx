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
import { database, taskRules, tasks } from '../../db';
import { RecurrenceType } from '../../db/models/Task';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { addDays, addWeeks, addMonths } from 'date-fns';

const RECURRENCE_OPTIONS: Array<{ label: string; value: RecurrenceType }> = [
  { label: 'Diário', value: 'daily' },
  { label: 'Semanal', value: 'weekly' },
  { label: 'Mensal', value: 'monthly' },
  { label: 'A cada X dias', value: 'every_x_days' },
];

const CATEGORIES = ['Limpeza', 'Manutenção', 'Pessoal', 'Estudo', 'Outros'];

export const TaskFormScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [isHighPriority, setIsHighPriority] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('daily');
  const [interval, setInterval] = useState('1');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Campo obrigatório', 'Por favor, informe o nome da tarefa.');
      return;
    }
    setLoading(true);
    try {
      const userId = 'local-user';
      await database.write(async () => {
        const rule = await taskRules.create(r => {
          r.title = title.trim();
          r.category = category || undefined;
          r.isHighPriority = isHighPriority;
          r.recurrenceType = recurrence;
          r.recurrenceInterval = parseInt(interval) || 1;
          r.isActive = true;
          r.createdBy = userId;
          r.updatedBy = userId;
        });

        // Create the first task instance
        const dueDate = new Date();
        await tasks.create(task => {
          task.ruleId = rule.id;
          (task as any)._raw.due_date = dueDate.getTime();
          task.isCompleted = false;
          task.isSnoozed = false;
          task.isSkipped = false;
          task.isArchived = false;
          task.createdBy = userId;
          task.updatedBy = userId;
        });
      });

      navigation.goBack();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar a tarefa.');
    } finally {
      setLoading(false);
    }
  };

  const RecurrenceChip: React.FC<{ option: typeof RECURRENCE_OPTIONS[0] }> = ({ option }) => {
    const selected = recurrence === option.value;
    return (
      <Button
        title={option.label}
        onPress={() => setRecurrence(option.value)}
        variant={selected ? 'primary' : 'secondary'}
        size="sm"
        style={{ marginRight: 8, marginBottom: 8 }}
      />
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.bold }]}>
          {t('tasks.newTask')}
        </Text>

        <Input
          label={t('tasks.taskName')}
          value={title}
          onChangeText={setTitle}
          placeholder="Ex: Limpar banheiro"
          autoFocus
        />

        <Text style={[styles.label, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily.medium }]}>
          {t('tasks.category')}
        </Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map(cat => (
            <Button
              key={cat}
              title={cat}
              onPress={() => setCategory(cat === category ? '' : cat)}
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
            <RecurrenceChip key={opt.value} option={opt} />
          ))}
        </View>

        {recurrence === 'every_x_days' && (
          <Input
            label={t('tasks.interval')}
            value={interval}
            onChangeText={setInterval}
            keyboardType="numeric"
            placeholder="Ex: 3"
          />
        )}

        <View style={[styles.switchRow, { borderTopColor: theme.colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.switchLabel, { color: theme.colors.text }]}>{t('common.highPriority')}</Text>
            <Text style={[styles.switchHint, { color: theme.colors.textMuted }]}>
              Aparece no início e em alertas de 7 dias
            </Text>
          </View>
          <Switch
            value={isHighPriority}
            onValueChange={setIsHighPriority}
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
  label: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    marginTop: 8,
  },
  switchLabel: { fontSize: 15, fontWeight: '500' },
  switchHint: { fontSize: 12, marginTop: 2 },
});
