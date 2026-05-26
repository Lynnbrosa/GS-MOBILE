import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { MainTabsParamList } from './types';
import { HomeStack } from './HomeStack';
import { FavoritesStack } from './FavoritesStack';
import { QueriesStack } from './QueriesStack';
import { SettingsScreen } from '../screens/main/SettingsScreen';
import { useTheme } from '../hooks/useTheme';

const Tabs = createBottomTabNavigator<MainTabsParamList>();

export function MainTabs() {
  const { theme } = useTheme();
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="QueriesTab"
        component={QueriesStack}
        options={{
          tabBarLabel: 'Consultas',
          tabBarIcon: ({ color, size }) => <Feather name="search" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="FavoritesTab"
        component={FavoritesStack}
        options={{
          tabBarLabel: 'Favoritos',
          tabBarIcon: ({ color, size }) => <Feather name="star" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Config',
          tabBarIcon: ({ color, size }) => <Feather name="settings" size={size} color={color} />,
        }}
      />
    </Tabs.Navigator>
  );
}
