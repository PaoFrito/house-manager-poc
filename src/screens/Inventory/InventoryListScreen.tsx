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
import { inventory, database, shoppingCart } from '../../db';
import { Inventory, InventoryStatus } from '../../db/models/Inventory';
import { updateInventoryStatus, addInventoryToShoppingList } from '../../services/inventoryService';
import { format, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

const STATUS_CONFIG: Record<InventoryStatus, { color: 'success' | 'warning' | 'error'; label: string }> = {
  IN_STOCK: { color: 'success', label: 'Em Estoque' },
  LOW: { color: 'warning', label: 'Baixo' },
  EMPTY: { color: 'error', label: 'Esgotado' },
};

export const InventoryListScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  const [items, setItems] = useState<Inventory[]>([]);

  const load = useCallback(async () => {
    const all = await inventory.query().fetch();
    setItems(all.sort((a, b) => {
      const order = { EMPTY: 0, LOW: 1, IN_STOCK: 2 };
      return order[a.status] - order[b.status];
    }));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (item: Inventory, status: InventoryStatus) => {
    await updateInventoryStatus(item, status);

    if (status === 'LOW' || status === 'EMPTY') {
      Alert.alert(
        t('inventory.addToShoppingList'),
        t('inventory.lowStockAlert', { name: item.name }),
        [
          { text: t('common.yes'), onPress: async () => { await addInventoryToShoppingList(item); } },
          { text: t('common.no'), style: 'cancel' },
        ]
      );
    }
    load();
  };

  const isExpiringSoon = (item: Inventory) =>
    item.isPerishable && item.expirationDate && isBefore(item.expirationDate, addDays(new Date(), 7));

  const InventoryCard: React.FC<{ item: Inventory }> = ({ item }) => {
    const cfg = STATUS_CONFIG[item.status];
    const expiring = isExpiringSoon(item);

    return (
      <Card style={{ marginBottom: 10 }}>
        <View style={styles.itemRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.itemHeader}>
              <Text style={[styles.itemName, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.medium }]}>
                {item.name}
              </Text>
              {expiring && <Ionicons name="warning" size={14} color={theme.colors.brand.warning} style={{ marginLeft: 6 }} />}
            </View>
            <View style={styles.metaRow}>
              {item.category && <Badge label={item.category} color="muted" />}
              <Badge label={cfg.label} color={cfg.color} />
              {item.isPerishable && item.expirationDate && (
                <Text style={[styles.expiryText, { color: expiring ? theme.colors.brand.warning : theme.colors.textMuted }]}>
                  Validade: {format(item.expirationDate, 'dd/MM/yy', { locale: ptBR })}
                </Text>
              )}
            </View>
          </View>

          {/* Status Cycle */}
          <View style={styles.statusCycle}>
            {(['IN_STOCK', 'LOW', 'EMPTY'] as InventoryStatus[]).map(s => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.statusBtn,
                  {
                    backgroundColor: item.status === s
                      ? (STATUS_CONFIG[s].color === 'success' ? theme.colors.brand.success : STATUS_CONFIG[s].color === 'warning' ? theme.colors.brand.warning : theme.colors.brand.error) + '30'
                      : theme.colors.surface,
                    borderColor: item.status === s
                      ? (STATUS_CONFIG[s].color === 'success' ? theme.colors.brand.success : STATUS_CONFIG[s].color === 'warning' ? theme.colors.brand.warning : theme.colors.brand.error)
                      : theme.colors.border,
                  },
                ]}
                onPress={() => handleStatusChange(item, s)}
              >
                <Text style={[styles.statusBtnText, {
                  color: item.status === s
                    ? (STATUS_CONFIG[s].color === 'success' ? theme.colors.brand.success : STATUS_CONFIG[s].color === 'warning' ? theme.colors.brand.warning : theme.colors.brand.error)
                    : theme.colors.textMuted,
                }]}>
                  {s === 'IN_STOCK' ? '✓' : s === 'LOW' ? '!' : '✗'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.bold }]}>
          {t('inventory.title')}
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        renderItem={({ item }) => <InventoryCard item={item} />}
        ListEmptyComponent={
          <EmptyState
            icon="cube-outline"
            title="Estoque vazio"
            subtitle="Adicione itens que você quer controlar"
            action={{ label: t('inventory.newItem'), onPress: () => navigation.navigate('InventoryForm') }}
          />
        }
      />

      <FAB onPress={() => navigation.navigate('InventoryForm')} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 26 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemHeader: { flexDirection: 'row', alignItems: 'center' },
  itemName: { fontSize: 15 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'wrap' },
  expiryText: { fontSize: 12 },
  statusCycle: { flexDirection: 'row', gap: 4 },
  statusBtn: { width: 28, height: 28, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statusBtnText: { fontSize: 14, fontWeight: '700' },
});
