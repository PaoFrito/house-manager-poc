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
import { database, inventory } from '../../db';
import { InventoryStatus } from '../../db/models/Inventory';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { addDays } from 'date-fns';

const CATEGORIES = ['Geladeira', 'Despensa', 'Remédios', 'Limpeza', 'Higiene', 'Outros'];

export const InventoryFormScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const prefillName = route.params?.prefillName ?? '';
  const prefillCategory = route.params?.prefillCategory ?? '';

  const [name, setName] = useState(prefillName);
  const [category, setCategory] = useState(prefillCategory || 'Geladeira');
  const [status, setStatus] = useState<InventoryStatus>('IN_STOCK');
  const [isPerishable, setIsPerishable] = useState(false);
  const [expiryDays, setExpiryDays] = useState('7');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Campo obrigatório', 'Informe o nome do item.');
      return;
    }

    setLoading(true);
    try {
      const userId = 'local-user';
      const expDate = isPerishable ? addDays(new Date(), parseInt(expiryDays) || 7) : undefined;

      await database.write(async () => {
        await inventory.create(item => {
          item.name = name.trim();
          item.category = category;
          item.status = status;
          item.isPerishable = isPerishable;
          if (expDate) (item as any)._raw.expiration_date = expDate.getTime();
          item.createdBy = userId;
          item.updatedBy = userId;
        });
      });

      navigation.goBack();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar o item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.bold }]}>
          {t('inventory.newItem')}
        </Text>

        <Input
          label={t('inventory.itemName')}
          value={name}
          onChangeText={setName}
          placeholder="Ex: Iogurte, Dipirona, Sabão em pó"
          autoFocus
        />

        <Text style={[styles.label, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily.medium }]}>
          {t('inventory.category')}
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

        <View style={[styles.switchRow, { borderTopColor: theme.colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.switchLabel, { color: theme.colors.text }]}>{t('inventory.perishable')}</Text>
            <Text style={[styles.switchHint, { color: theme.colors.textMuted }]}>Possui data de validade</Text>
          </View>
          <Switch
            value={isPerishable}
            onValueChange={setIsPerishable}
            trackColor={{ true: theme.colors.brand.primary }}
            thumbColor="#fff"
          />
        </View>

        {isPerishable && (
          <Input
            label="Validade (em dias a partir de hoje)"
            value={expiryDays}
            onChangeText={setExpiryDays}
            keyboardType="numeric"
            placeholder="7"
          />
        )}

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
