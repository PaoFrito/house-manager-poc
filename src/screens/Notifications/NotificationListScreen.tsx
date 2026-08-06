import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/UIKit';
import { getOverdueTasks } from '../../services/taskService';
import { getOverdueBills } from '../../services/billService';
import { getExpiringItems, getLowStockItems } from '../../services/inventoryService';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

interface NotificationItem {
  id: string;
  type: 'task' | 'bill' | 'inventory' | 'expiry';
  title: string;
  subtitle: string;
  date: Date;
  route: string;
}

export const NotificationListScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    async function load() {
      const [ot, ob, ls, ex] = await Promise.all([
        getOverdueTasks(),
        getOverdueBills(),
        getLowStockItems(),
        getExpiringItems(7),
      ]);

      const items: NotificationItem[] = [
        ...ot.map(t => ({
          id: `task-${t.id}`,
          type: 'task' as const,
          title: `Tarefa Vencida`,
          subtitle: `Tarefa #${t.ruleId.slice(-4)}`,
          date: t.dueDate,
          route: 'Tasks',
        })),
        ...ob.map(b => ({
          id: `bill-${b.id}`,
          type: 'bill' as const,
          title: `Conta Vencida`,
          subtitle: `Valor: R$ ${b.amount.toFixed(2)}`,
          date: b.dueDate,
          route: 'Finance',
        })),
        ...ls.map(i => ({
          id: `stock-${i.id}`,
          type: 'inventory' as const,
          title: `Estoque Baixo: ${i.name}`,
          subtitle: `Clique para adicionar à lista de compras`,
          date: new Date(),
          route: 'Inventory',
        })),
        ...ex.map(i => ({
          id: `exp-${i.id}`,
          type: 'expiry' as const,
          title: `Item Vencendo: ${i.name}`,
          subtitle: `Validade aproximada`,
          date: i.expirationDate ?? new Date(),
          route: 'Inventory',
        })),
      ];

      setNotifications(items);
    }
    load();
  }, []);

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'task': return { name: 'clipboard-outline' as const, color: theme.colors.brand.primary };
      case 'bill': return { name: 'wallet-outline' as const, color: theme.colors.brand.warning };
      case 'inventory': return { name: 'cube-outline' as const, color: theme.colors.brand.info };
      case 'expiry': return { name: 'alert-circle-outline' as const, color: theme.colors.brand.error };
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.bold }]}>
          {t('notifications.title')}
        </Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        renderItem={({ item }) => {
          const icon = getIcon(item.type);
          return (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate(item.route)}
            >
              <Card style={{ marginBottom: 10 }}>
                <View style={styles.row}>
                  <View style={[styles.iconBox, { backgroundColor: icon.color + '20' }]}>
                    <Ionicons name={icon.name} size={20} color={icon.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitle, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.semiBold }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.itemSubtitle, { color: theme.colors.textSecondary }]}>
                      {item.subtitle}
                    </Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title={t('notifications.noNotifications')}
            subtitle="Tudo em dia com sua casa! 🎉"
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  title: { fontSize: 26 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontSize: 14 },
  itemSubtitle: { fontSize: 12, marginTop: 2 },
});
