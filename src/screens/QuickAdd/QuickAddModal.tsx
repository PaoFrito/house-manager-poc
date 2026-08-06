import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

export const QuickAddModal: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const options = [
    { label: t('tasks.newTask'), icon: 'checkbox-outline' as const, route: 'TaskForm', color: theme.colors.brand.primary },
    { label: t('finance.newBill'), icon: 'wallet-outline' as const, route: 'BillForm', color: theme.colors.brand.warning },
    { label: t('notes.newNote'), icon: 'document-text-outline' as const, route: 'NoteEditor', color: theme.colors.brand.secondary },
    { label: t('inventory.newItem'), icon: 'cube-outline' as const, route: 'InventoryForm', color: theme.colors.brand.info },
    { label: t('shopping.newItem'), icon: 'cart-outline' as const, route: 'ShoppingForm', color: theme.colors.brand.success },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
      <View style={[styles.sheet, { backgroundColor: theme.colors.surfaceElevated }]}>
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.bold }]}>
            Adicionar Novo
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {options.map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.gridItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => {
                navigation.goBack();
                navigation.navigate(opt.route);
              }}
            >
              <View style={[styles.iconBox, { backgroundColor: opt.color + '20' }]}>
                <Ionicons name={opt.icon} size={24} color={opt.color} />
              </View>
              <Text style={[styles.itemText, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.medium }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 18 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: { fontSize: 14, flex: 1 },
});
