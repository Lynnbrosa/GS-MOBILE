import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../hooks/useTheme';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: 'default' | 'primary' | 'accent' | 'danger';
};

export function Chip({ label, selected = false, onPress, tone = 'default' }: ChipProps) {
  const { theme } = useTheme();

  const palette = (() => {
    if (selected) {
      switch (tone) {
        case 'accent':
          return { bg: theme.colors.accentSoft, fg: theme.colors.accent, border: theme.colors.accent };
        case 'danger':
          return { bg: theme.colors.dangerSoft, fg: theme.colors.danger, border: theme.colors.danger };
        case 'primary':
        default:
          return { bg: theme.colors.primarySoft, fg: theme.colors.primary, border: theme.colors.primary };
      }
    }
    return {
      bg: theme.colors.surface,
      fg: theme.colors.textMuted,
      border: theme.colors.border,
    };
  })();

  const Container = onPress ? Pressable : (props: { children: React.ReactNode; style: object }) => (
    <Pressable disabled style={props.style as object}>{props.children}</Pressable>
  );

  return (
    <Container
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderRadius: theme.radius.pill,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.xs,
        },
      ]}
    >
      <Text style={[theme.typography.caption, { color: palette.fg, fontWeight: '600' }]}>
        {label}
      </Text>
    </Container>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
});
