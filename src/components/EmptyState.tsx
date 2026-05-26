import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from './Button';
import { useTheme } from '../hooks/useTheme';

type EmptyStateProps = {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { padding: theme.spacing.xl }]}>
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: theme.colors.surfaceAlt,
            borderRadius: theme.radius.pill,
            width: 72,
            height: 72,
          },
        ]}
      >
        <Feather name={icon} size={32} color={theme.colors.textMuted} />
      </View>
      <Text
        style={[
          theme.typography.subtitle,
          { color: theme.colors.text, marginTop: theme.spacing.lg, textAlign: 'center' },
        ]}
      >
        {title}
      </Text>
      {description ? (
        <Text
          style={[
            theme.typography.body,
            {
              color: theme.colors.textMuted,
              marginTop: theme.spacing.sm,
              textAlign: 'center',
              maxWidth: 320,
            },
          ]}
        >
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: theme.spacing.lg }}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
