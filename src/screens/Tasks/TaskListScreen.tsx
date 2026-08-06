import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../../components/Card';
import { Badge, EmptyState, FAB } from '../../components/UIKit';
import { tasks, taskRules } from '../../db';
import { Task } from '../../db/models/Task';
import { TaskRule } from '../../db/models/Task';
import { completeTask, snoozeTask, skipTask, calculateStreak } from '../../services/taskService';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

const StreakDots: React.FC<{ streak: boolean[] }> = ({ streak }) => {
  const theme = useTheme();
  return (
    <View style={styles.streakRow}>
      {streak.map((done, i) => (
        <View
          key={i}
          style={[
            styles.streakDot,
            {
              backgroundColor: done
                ? theme.colors.brand.success
                : theme.colors.borderSubtle,
            },
          ]}
        />
      ))}
    </View>
  );
};

interface TaskCardProps {
  task: Task;
  rule?: TaskRule;
  onUpdate: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, rule, onUpdate }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [streak, setStreak] = useState<boolean[]>([]);

  useEffect(() => {
    calculateStreak(task.ruleId).then(setStreak);
  }, [task.ruleId]);

  const isOverdue = !task.isCompleted && isPast(task.dueDate);

  const handleSnooze = () => {
    Alert.alert(t('tasks.snooze'), '', [
      { text: t('tasks.snooze1day'), onPress: async () => { await snoozeTask(task, '1day'); onUpdate(); } },
      { text: t('tasks.snooze1week'), onPress: async () => { await snoozeTask(task, '1week'); onUpdate(); } },
      { text: t('tasks.skipInstance'), style: 'destructive', onPress: async () => { await skipTask(task); onUpdate(); } },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const formatDue = () => {
    if (isToday(task.dueDate)) return t('common.today');
    if (isTomorrow(task.dueDate)) return t('common.tomorrow');
    return format(task.dueDate, 'EEE, dd/MM', { locale: ptBR });
  };

  return (
    <Card style={{ marginBottom: 10 }}>
      <View style={styles.taskHeader}>
        <TouchableOpacity
          style={[
            styles.checkbox,
            {
              backgroundColor: task.isCompleted ? theme.colors.brand.success : 'transparent',
              borderColor: task.isCompleted ? theme.colors.brand.success : theme.colors.border,
            },
          ]}
          onPress={async () => {
            if (!task.isCompleted) {
              await completeTask(task);
              onUpdate();
            }
          }}
        >
          {task.isCompleted && <Ionicons name="checkmark" size={14} color="#fff" />}
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text
            style={[
              styles.taskTitle,
              {
                color: task.isCompleted ? theme.colors.textMuted : theme.colors.text,
                fontFamily: theme.typography.fontFamily.medium,
                textDecorationLine: task.isCompleted ? 'line-through' : 'none',
              },
            ]}
          >
            {rule?.title ?? `Tarefa #${task.ruleId.slice(-6)}`}
          </Text>
          <View style={styles.metaRow}>
            {rule?.category && <Badge label={rule.category} color="muted" />}
            {rule?.isHighPriority && <Badge label={t('common.highPriority')} color="error" />}
            <Text style={[styles.dueText, { color: isOverdue ? theme.colors.brand.error : theme.colors.textMuted }]}>
              {isOverdue ? `⚠ ${t('common.overdue')}` : formatDue()}
            </Text>
          </View>
        </View>

        {!task.isCompleted && (
          <TouchableOpacity onPress={handleSnooze} style={styles.snoozeBtn}>
            <Ionicons name="time-outline" size={20} color={theme.colors.icon} />
          </TouchableOpacity>
        )}
      </View>

      {streak.length > 0 && (
        <View style={{ marginTop: 10 }}>
          <Text style={[styles.streakLabel, { color: theme.colors.textMuted }]}>
            {t('tasks.last7days')}
          </Text>
          <StreakDots streak={streak} />
        </View>
      )}
    </Card>
  );
};

export const TaskListScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  const [taskList, setTaskList] = useState<Task[]>([]);
  const [rules, setRules] = useState<Record<string, TaskRule>>({});

  const load = useCallback(async () => {
    const allTasks = await tasks.query().fetch();
    const allRules = await taskRules.query().fetch();
    const active = allTasks.filter(t => !t.isArchived && !t.isSkipped).sort(
      (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
    );
    setTaskList(active);
    const ruleMap: Record<string, TaskRule> = {};
    allRules.forEach(r => (ruleMap[r.id] = r));
    setRules(ruleMap);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.screenHeader}>
        <Text style={[styles.screenTitle, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.bold }]}>
          {t('tasks.title')}
        </Text>
      </View>

      <FlatList
        data={taskList}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TaskCard task={item} rule={rules[item.ruleId]} onUpdate={load} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="checkmark-circle-outline"
            title="Nenhuma tarefa pendente"
            subtitle="Adicione tarefas recorrentes ou únicas"
            action={{ label: t('tasks.newTask'), onPress: () => navigation.navigate('TaskForm') }}
          />
        }
      />

      <FAB onPress={() => navigation.navigate('TaskForm')} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screenHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  screenTitle: { fontSize: 26 },
  taskHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  taskTitle: { fontSize: 15 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'wrap' },
  dueText: { fontSize: 12 },
  snoozeBtn: { padding: 4 },
  streakLabel: { fontSize: 11, marginBottom: 5 },
  streakRow: { flexDirection: 'row', gap: 5 },
  streakDot: { width: 10, height: 10, borderRadius: 5 },
});
