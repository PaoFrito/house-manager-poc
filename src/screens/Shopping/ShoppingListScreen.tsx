import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../../components/Card';
import { EmptyState, FAB } from '../../components/UIKit';
import { shoppingCart, database } from '../../db';
import { ShoppingCartItem } from '../../db/models/ShoppingCartItem';
import { restockFromShoppingItem, checkDuplicateInInventory } from '../../services/inventoryService';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useSettingsStore } from '../../store/settingsStore';

const SHOPPING_CATEGORIES = ['Hortifrúti', 'Laticínios', 'Limpeza', 'Higiene', 'Mercearia', 'Outros'];

export const ShoppingListScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const currency = useSettingsStore(s => s.currency);

  const [cartItems, setCartItems] = useState<ShoppingCartItem[]>([]);

  const load = useCallback(async () => {
    const all = await shoppingCart.query().fetch();
    setCartItems(all.filter(i => !i.isBought).sort((a, b) => (a.category ?? '').localeCompare(b.category ?? '')));
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalCost = cartItems.reduce((sum, i) => sum + i.estimatedCost, 0);

  // Group by category
  const grouped = SHOPPING_CATEGORIES.reduce<Record<string, ShoppingCartItem[]>>((acc, cat) => {
    const items = cartItems.filter(i => (i.category ?? 'Outros') === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  // Add any items with unknown categories
  const unknownCat = cartItems.filter(i => !SHOPPING_CATEGORIES.includes(i.category ?? ''));
  if (unknownCat.length > 0) grouped['Outros'] = [...(grouped['Outros'] ?? []), ...unknownCat];

  const sections = Object.entries(grouped).map(([title, data]) => ({ title, data }));

  const handleBought = async (item: ShoppingCartItem) => {
    const hasInventory = !!item.inventoryId;

    if (hasInventory) {
      // Restock inventory item automatically
      await restockFromShoppingItem(item);
    } else {
      // Ask if user wants to add to inventory
      Alert.alert(
        t('shopping.addToInventory'),
        t('shopping.addToInventoryPrompt', { name: item.name }),
        [
          {
            text: t('common.yes'),
            onPress: async () => {
              await database.write(async () => {
                await item.update(i => {
                  i.isBought = true;
                  (i as any)._raw.bought_at = Date.now();
                });
              });
              navigation.navigate('InventoryForm', { prefillName: item.name, prefillCategory: item.category });
            },
          },
          {
            text: t('common.no'),
            onPress: async () => {
              await database.write(async () => {
                await item.update(i => {
                  i.isBought = true;
                  (i as any)._raw.bought_at = Date.now();
                });
              });
            },
          },
        ]
      );
    }
    load();
  };

  const ShoppingRow: React.FC<{ item: ShoppingCartItem }> = ({ item }) => (
    <View style={[styles.itemRow, { borderBottomColor: theme.colors.borderSubtle }]}>
      <TouchableOpacity
        style={[styles.checkbox, { borderColor: theme.colors.border }]}
        onPress={() => handleBought(item)}
      >
        <Ionicons name="square-outline" size={22} color={theme.colors.textMuted} />
      </TouchableOpacity>
      <Text style={[styles.itemName, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.regular, flex: 1 }]}>
        {item.name}
      </Text>
      {item.estimatedCost > 0 && (
        <Text style={[styles.itemCost, { color: theme.colors.textSecondary }]}>
          {currency} {item.estimatedCost.toFixed(2)}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.bold }]}>
          {t('shopping.title')}
        </Text>
        {totalCost > 0 && (
          <View style={[styles.totalChip, { backgroundColor: theme.colors.brand.primary + '20' }]}>
            <Text style={[styles.totalText, { color: theme.colors.brand.primary }]}>
              {t('shopping.totalCost')}: {currency} {totalCost.toFixed(2)}
            </Text>
          </View>
        )}
      </View>

      {sections.length === 0 ? (
        <EmptyState
          icon="cart-outline"
          title="Lista de compras vazia"
          subtitle="Adicione itens ou marque estoque como baixo/esgotado"
          action={{ label: t('shopping.newItem'), onPress: () => navigation.navigate('ShoppingForm') }}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          renderSectionHeader={({ section }) => (
            <View style={[styles.sectionHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily.semiBold }]}>
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item }) => <ShoppingRow item={item} />}
        />
      )}

      <FAB onPress={() => navigation.navigate('ShoppingForm')} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 26, marginBottom: 8 },
  totalChip: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  totalText: { fontSize: 13, fontWeight: '600' },
  sectionHeader: { paddingVertical: 10, borderBottomWidth: 1, marginBottom: 4 },
  sectionTitle: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, gap: 10 },
  checkbox: { padding: 2 },
  itemName: { fontSize: 15 },
  itemCost: { fontSize: 13 },
});
