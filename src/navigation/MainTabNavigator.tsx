import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useTranslation } from 'react-i18next';

import { DashboardScreen } from '../screens/Dashboard/DashboardScreen';
import { TaskListScreen } from '../screens/Tasks/TaskListScreen';
import { FinanceScreen } from '../screens/Finance/FinanceScreen';
import { NoteListScreen } from '../screens/Notes/NoteListScreen';
import { InventoryListScreen } from '../screens/Inventory/InventoryListScreen';
import { ShoppingListScreen } from '../screens/Shopping/ShoppingListScreen';
import { CalendarScreen } from '../screens/Calendar/CalendarScreen';
import { SettingsScreen } from '../screens/Settings/SettingsScreen';

const Tab = createBottomTabNavigator();

export const MainTabNavigator: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: theme.colors.brand.primary,
        tabBarInactiveTintColor: theme.colors.icon,
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';
          if (route.name === 'DashboardTab') iconName = 'home-outline';
          else if (route.name === 'TasksTab') iconName = 'checkbox-outline';
          else if (route.name === 'FinanceTab') iconName = 'wallet-outline';
          else if (route.name === 'NotesTab') iconName = 'document-text-outline';
          else if (route.name === 'InventoryTab') iconName = 'cube-outline';
          else if (route.name === 'ShoppingTab') iconName = 'cart-outline';
          else if (route.name === 'CalendarTab') iconName = 'calendar-outline';
          else if (route.name === 'SettingsTab') iconName = 'settings-outline';

          return <Ionicons name={iconName} size={size - 2} color={color} />;
        },
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardScreen} options={{ tabBarLabel: t('tabs.dashboard') }} />
      <Tab.Screen name="TasksTab" component={TaskListScreen} options={{ tabBarLabel: t('tabs.tasks') }} />
      <Tab.Screen name="FinanceTab" component={FinanceScreen} options={{ tabBarLabel: t('tabs.finance') }} />
      <Tab.Screen name="NotesTab" component={NoteListScreen} options={{ tabBarLabel: t('tabs.notes') }} />
      <Tab.Screen name="InventoryTab" component={InventoryListScreen} options={{ tabBarLabel: t('tabs.inventory') }} />
      <Tab.Screen name="ShoppingTab" component={ShoppingListScreen} options={{ tabBarLabel: t('tabs.shopping') }} />
      <Tab.Screen name="CalendarTab" component={CalendarScreen} options={{ tabBarLabel: t('tabs.calendar') }} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} options={{ tabBarLabel: t('tabs.settings') }} />
    </Tab.Navigator>
  );
};
