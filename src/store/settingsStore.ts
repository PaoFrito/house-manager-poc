import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'dark' | 'light';
export type Language = 'pt-BR' | 'en';
export type TimeFormat = '12h' | '24h';
export type Currency = string; // ISO 4217

export interface NotificationChannels {
  billDueDates: boolean;
  choreReminders: boolean;
  inventoryExpirations: boolean;
}

export interface QuietHours {
  enabled: boolean;
  start: string; // HH:mm
  end: string;   // HH:mm
}

export interface SettingsState {
  // Appearance
  theme: Theme;
  language: Language;
  currency: Currency;
  timeFormat: TimeFormat;
  timezone: string;

  // Security
  biometricEnabled: boolean;
  pinEnabled: boolean;
  pin: string | null;

  // Notifications
  notificationChannels: NotificationChannels;
  quietHours: QuietHours;
  digestTime: string; // HH:mm

  // Data
  autoArchiveThreshold: number | null; // days, null = never

  // Actions
  setTheme: (t: Theme) => void;
  setLanguage: (l: Language) => void;
  setCurrency: (c: Currency) => void;
  setTimeFormat: (tf: TimeFormat) => void;
  setTimezone: (tz: string) => void;
  setBiometricEnabled: (v: boolean) => void;
  setPinEnabled: (v: boolean) => void;
  setPin: (pin: string | null) => void;
  setNotificationChannels: (ch: Partial<NotificationChannels>) => void;
  setQuietHours: (qh: Partial<QuietHours>) => void;
  setDigestTime: (t: string) => void;
  setAutoArchiveThreshold: (v: number | null) => void;
  resetAll: () => void;
}

const DEFAULT_STATE = {
  theme: 'dark' as Theme,
  language: 'pt-BR' as Language,
  currency: 'BRL',
  timeFormat: '24h' as TimeFormat,
  timezone: 'America/Sao_Paulo',
  biometricEnabled: false,
  pinEnabled: false,
  pin: null,
  notificationChannels: {
    billDueDates: true,
    choreReminders: true,
    inventoryExpirations: true,
  },
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '07:00',
  },
  digestTime: '08:00',
  autoArchiveThreshold: 30,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,

      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setCurrency: (currency) => set({ currency }),
      setTimeFormat: (timeFormat) => set({ timeFormat }),
      setTimezone: (timezone) => set({ timezone }),
      setBiometricEnabled: (biometricEnabled) => set({ biometricEnabled }),
      setPinEnabled: (pinEnabled) => set({ pinEnabled }),
      setPin: (pin) => set({ pin }),
      setNotificationChannels: (ch) =>
        set((s) => ({ notificationChannels: { ...s.notificationChannels, ...ch } })),
      setQuietHours: (qh) =>
        set((s) => ({ quietHours: { ...s.quietHours, ...qh } })),
      setDigestTime: (digestTime) => set({ digestTime }),
      setAutoArchiveThreshold: (autoArchiveThreshold) => set({ autoArchiveThreshold }),
      resetAll: () => set({ ...DEFAULT_STATE }),
    }),
    {
      name: 'house-manager-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
