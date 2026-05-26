import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';

export function RootNavigator() {
  const { token, loading } = useAuth();
  const { theme, hydrated } = useTheme();

  const navTheme = theme.mode === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...navTheme,
    colors: {
      ...navTheme.colors,
      background: theme.colors.bg,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      primary: theme.colors.primary,
      notification: theme.colors.accent,
    },
  };

  if (loading || !hydrated) {
    return (
      <View style={[styles.splash, { backgroundColor: theme.colors.bg }]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {token ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
