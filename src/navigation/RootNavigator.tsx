import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from './MainTabNavigator';
import { TaskFormScreen } from '../screens/Tasks/TaskFormScreen';
import { BillFormScreen } from '../screens/Finance/BillFormScreen';
import { NoteEditorScreen } from '../screens/Notes/NoteEditorScreen';
import { InventoryFormScreen } from '../screens/Inventory/InventoryFormScreen';
import { ShoppingItemFormScreen } from '../screens/Shopping/ShoppingItemFormScreen';
import { QuickAddModal } from '../screens/QuickAdd/QuickAddModal';
import { NotificationListScreen } from '../screens/Notifications/NotificationListScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="Tasks" component={MainTabNavigator} />
      <Stack.Screen name="Finance" component={MainTabNavigator} />
      <Stack.Screen name="Notes" component={MainTabNavigator} />
      <Stack.Screen name="Inventory" component={MainTabNavigator} />
      <Stack.Screen name="Shopping" component={MainTabNavigator} />
      <Stack.Screen name="TaskForm" component={TaskFormScreen} />
      <Stack.Screen name="BillForm" component={BillFormScreen} />
      <Stack.Screen name="NoteEditor" component={NoteEditorScreen} />
      <Stack.Screen name="InventoryForm" component={InventoryFormScreen} />
      <Stack.Screen name="ShoppingForm" component={ShoppingItemFormScreen} />
      <Stack.Screen name="Notifications" component={NotificationListScreen} />
      <Stack.Screen
        name="QuickAdd"
        component={QuickAddModal}
        options={{
          presentation: 'transparentModal',
          animation: 'fade',
        }}
      />
    </Stack.Navigator>
  );
};
