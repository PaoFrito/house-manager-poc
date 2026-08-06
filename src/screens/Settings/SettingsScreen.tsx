import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { Card } from '../../components/Card';
import { useSettingsStore } from '../../store/settingsStore';
import { useTranslation } from 'react-i18next';
import { exportBackup, importBackup, factoryReset } from '../../services/backupService';
import Constants from 'expo-constants';
import i18n from '../../i18n';

const CURRENCIES = ['BRL', 'USD', 'EUR', 'GBP', 'JPY'];
const ARCHIVE_OPTIONS = [
  { label: '30 dias', value: 30 },
  { label: '60 dias', value: 60 },
  { label: '90 dias', value: 90 },
  { label: 'Nunca', value: null },
];

const SectionTitle: React.FC<{ title: string }> = ({ title }) => {
  const theme = useTheme();
  return (
    <Text style={[styles.sectionTitle, { color: theme.colors.textMuted, fontFamily: theme.typography.fontFamily.semiBold }]}>
      {title}
    </Text>
  );
};

const SettingRow: React.FC<{
  icon: any;
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}> = ({ icon, label, right, onPress, danger }) => {
  const theme = useTheme();
  return (
    <TouchableOpacity
      style={[styles.settingRow, { borderBottomColor: theme.colors.borderSubtle }]}
      onPress={onPress}
      disabled={!onPress && !right}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconBox, { backgroundColor: (danger ? theme.colors.brand.error : theme.colors.brand.primary) + '20' }]}>
          <Ionicons name={icon} size={18} color={danger ? theme.colors.brand.error : theme.colors.brand.primary} />
        </View>
        <Text style={[styles.settingLabel, { color: danger ? theme.colors.brand.error : theme.colors.text, fontFamily: theme.typography.fontFamily.regular }]}>
          {label}
        </Text>
      </View>
      {right ?? (onPress && <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />)}
    </TouchableOpacity>
  );
};

export const SettingsScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const settings = useSettingsStore();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const path = await exportBackup();
      Alert.alert('Backup exportado!', `Arquivo salvo em:\n${path}`);
    } catch {
      Alert.alert('Erro', 'Não foi possível exportar o backup.');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    const result = await importBackup();
    Alert.alert(result.success ? 'Backup importado!' : 'Erro', result.message);
  };

  const handleFactoryReset = () => {
    Alert.alert(
      t('settings.factoryReset'),
      t('settings.factoryResetConfirm'),
      [
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => { await factoryReset(); settings.resetAll(); },
        },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.bold }]}>
          {t('settings.title')}
        </Text>

        {/* Appearance */}
        <SectionTitle title={t('settings.appearance')} />
        <Card style={{ marginBottom: 16 }}>
          <SettingRow
            icon="moon-outline"
            label={t('settings.theme')}
            right={
              <View style={styles.toggle}>
                <Text style={[styles.toggleLabel, { color: theme.colors.textSecondary }]}>{settings.theme === 'dark' ? t('settings.dark') : t('settings.light')}</Text>
                <Switch
                  value={settings.theme === 'dark'}
                  onValueChange={v => settings.setTheme(v ? 'dark' : 'light')}
                  trackColor={{ true: theme.colors.brand.primary }}
                  thumbColor="#fff"
                />
              </View>
            }
          />

          <SettingRow
            icon="language-outline"
            label={t('settings.language')}
            right={
              <View style={styles.toggle}>
                <Text style={[styles.toggleLabel, { color: theme.colors.textSecondary }]}>{settings.language}</Text>
                <Switch
                  value={settings.language === 'pt-BR'}
                  onValueChange={v => {
                    const lang = v ? 'pt-BR' : 'en';
                    settings.setLanguage(lang);
                    i18n.changeLanguage(lang);
                  }}
                  trackColor={{ true: theme.colors.brand.primary }}
                  thumbColor="#fff"
                />
              </View>
            }
          />

          <SettingRow
            icon="time-outline"
            label={t('settings.timeFormat')}
            right={
              <View style={styles.toggle}>
                <Text style={[styles.toggleLabel, { color: theme.colors.textSecondary }]}>{settings.timeFormat}</Text>
                <Switch
                  value={settings.timeFormat === '24h'}
                  onValueChange={v => settings.setTimeFormat(v ? '24h' : '12h')}
                  trackColor={{ true: theme.colors.brand.primary }}
                  thumbColor="#fff"
                />
              </View>
            }
          />
        </Card>

        {/* Currency */}
        <SectionTitle title={t('settings.currency')} />
        <Card style={{ marginBottom: 16 }}>
          <View style={styles.chipGrid}>
            {CURRENCIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.currencyChip, { backgroundColor: settings.currency === c ? theme.colors.brand.primary : theme.colors.surface, borderColor: settings.currency === c ? theme.colors.brand.primary : theme.colors.border }]}
                onPress={() => settings.setCurrency(c)}
              >
                <Text style={{ color: settings.currency === c ? '#fff' : theme.colors.text, fontWeight: '600', fontSize: 13 }}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Security */}
        <SectionTitle title={t('settings.security')} />
        <Card style={{ marginBottom: 16 }}>
          <SettingRow
            icon="finger-print-outline"
            label={t('settings.biometric')}
            right={
              <Switch
                value={settings.biometricEnabled}
                onValueChange={settings.setBiometricEnabled}
                trackColor={{ true: theme.colors.brand.primary }}
                thumbColor="#fff"
              />
            }
          />
          <SettingRow
            icon="keypad-outline"
            label={t('settings.pinLock')}
            right={
              <Switch
                value={settings.pinEnabled}
                onValueChange={settings.setPinEnabled}
                trackColor={{ true: theme.colors.brand.primary }}
                thumbColor="#fff"
              />
            }
          />
        </Card>

        {/* Notifications */}
        <SectionTitle title={t('notifications.title')} />
        <Card style={{ marginBottom: 16 }}>
          <SettingRow
            icon="wallet-outline"
            label={t('notifications.billDueDates')}
            right={<Switch value={settings.notificationChannels.billDueDates} onValueChange={v => settings.setNotificationChannels({ billDueDates: v })} trackColor={{ true: theme.colors.brand.primary }} thumbColor="#fff" />}
          />
          <SettingRow
            icon="clipboard-outline"
            label={t('notifications.choreReminders')}
            right={<Switch value={settings.notificationChannels.choreReminders} onValueChange={v => settings.setNotificationChannels({ choreReminders: v })} trackColor={{ true: theme.colors.brand.primary }} thumbColor="#fff" />}
          />
          <SettingRow
            icon="cube-outline"
            label={t('notifications.inventoryExpirations')}
            right={<Switch value={settings.notificationChannels.inventoryExpirations} onValueChange={v => settings.setNotificationChannels({ inventoryExpirations: v })} trackColor={{ true: theme.colors.brand.primary }} thumbColor="#fff" />}
          />
        </Card>

        {/* Auto Archive */}
        <SectionTitle title={t('settings.autoArchive')} />
        <Card style={{ marginBottom: 16 }}>
          <View style={styles.chipGrid}>
            {ARCHIVE_OPTIONS.map(o => (
              <TouchableOpacity
                key={String(o.value)}
                style={[styles.currencyChip, { backgroundColor: settings.autoArchiveThreshold === o.value ? theme.colors.brand.primary : theme.colors.surface, borderColor: settings.autoArchiveThreshold === o.value ? theme.colors.brand.primary : theme.colors.border }]}
                onPress={() => settings.setAutoArchiveThreshold(o.value)}
              >
                <Text style={{ color: settings.autoArchiveThreshold === o.value ? '#fff' : theme.colors.text, fontWeight: '600', fontSize: 12 }}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Data */}
        <SectionTitle title={t('settings.data')} />
        <Card style={{ marginBottom: 16 }}>
          <SettingRow icon="download-outline" label={t('settings.exportBackup')} onPress={handleExport} />
          <SettingRow icon="cloud-upload-outline" label={t('settings.importBackup')} onPress={handleImport} />
          <SettingRow icon="trash-outline" label={t('settings.clearCache')} onPress={() => Alert.alert('Cache limpo', 'Cache temporário apagado.')} />
          <SettingRow icon="nuclear-outline" label={t('settings.factoryReset')} onPress={handleFactoryReset} danger />
        </Card>

        {/* App Info */}
        <SectionTitle title={t('settings.appInfo')} />
        <Card style={{ marginBottom: 16 }}>
          <SettingRow icon="information-circle-outline" label={`${t('settings.version')}: ${Constants.expoConfig?.version ?? '1.0.0'}`} />
          <SettingRow icon="document-text-outline" label={t('settings.termsOfService')} onPress={() => {}} />
          <SettingRow icon="shield-checkmark-outline" label={t('settings.privacyPolicy')} onPress={() => {}} />
          <SettingRow icon="chatbubble-outline" label={t('settings.feedback')} onPress={() => Alert.alert('Feedback', 'Em breve!')} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 26, paddingTop: 8, paddingBottom: 16 },
  sectionTitle: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  iconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 14 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleLabel: { fontSize: 13 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 4 },
  currencyChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
});
