import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

export type AlertTone = 'info' | 'success' | 'error' | 'warning';

type AlertProps = {
  tone?: AlertTone;
  title?: string;
  message: string;
};

export function Alert({ tone = 'info', title, message }: AlertProps) {
  const { theme } = useTheme();

  const palette = (() => {
    switch (tone) {
      case 'success':
        return {
          bg: theme.colors.successSoft,
          fg: theme.colors.success,
          icon: 'check-circle' as const,
        };
      case 'error':
        return {
          bg: theme.colors.dangerSoft,
          fg: theme.colors.danger,
          icon: 'alert-circle' as const,
        };
      case 'warning':
        return {
          bg: theme.colors.warningSoft,
          fg: theme.colors.warning,
          icon: 'alert-triangle' as const,
        };
      case 'info':
      default:
        return {
          bg: theme.colors.primarySoft,
          fg: theme.colors.primary,
          icon: 'info' as const,
        };
    }
  })();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.bg,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
        },
      ]}
    >
      <Feather name={palette.icon} size={18} color={palette.fg} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, marginLeft: theme.spacing.sm }}>
        {title ? (
          <Text style={[theme.typography.bodyStrong, { color: palette.fg }]}>{title}</Text>
        ) : null}
        <Text
          style={[
            theme.typography.body,
            { color: palette.fg, marginTop: title ? 2 : 0 },
          ]}
        >
          {message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});
