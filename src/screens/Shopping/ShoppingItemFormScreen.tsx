import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { database, shoppingCart } from '../../db';
import { checkDuplicateInInventory } from '../../services/inventoryService';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

const CATEGORIES = ['Hortifrúti', 'Laticínios', 'Limpeza', 'Higiene', 'Mercearia', 'Outros'];

export const ShoppingItemFormScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Hortifrúti');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleNameChange = async (val: string) => {
    setName(val);
    if (val.trim().length > 2) {
      const match = await checkDuplicateInInventory(val);
      setDuplicateWarning(!!match);
    } else {
      setDuplicateWarning(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Campo obrigatório', 'Informe o nome do item.');
      return;
    }

    setLoading(true);
    try {
      const userId = 'local-user';
      const cost = parseFloat(estimatedCost.replace(',', '.')) || 0;

      await database.write(async () => {
        await shoppingCart.create(item => {
          item.name = name.trim();
          item.category = category;
          item.estimatedCost = cost;
          item.isBought = false;
          item.createdBy = userId;
          item.updatedBy = userId;
        });
      });

      navigation.goBack();
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível adicionar o item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.bold }]}>
          {t('shopping.newItem')}
        </Text>

        <Input
          label="Item"
          value={name}
          onChangeText={handleNameChange}
          placeholder="Ex: Leite, Maçã, Detergente"
          error={duplicateWarning ? t('shopping.duplicate') : undefined}
          autoFocus
        />

        <Input
          label={t('shopping.estimatedCost')}
          value={estimatedCost}
          onChangeText={setEstimatedCost}
          keyboardType="numeric"
          placeholder="0.00"
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
});
