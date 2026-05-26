import React, { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  style?: ViewStyle | ViewStyle[];
  fullWidth?: boolean;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
  style,
  fullWidth = false,
}: ButtonProps) {
  const { theme } = useTheme();

  const palette = (() => {
    switch (variant) {
      case 'secondary':
        return {
          bg: theme.colors.surfaceAlt,
          fg: theme.colors.text,
          border: theme.colors.border,
        };
      case 'ghost':
        return {
          bg: 'transparent',
          fg: theme.colors.primary,
          border: 'transparent',
        };
      case 'destructive':
        return {
          bg: theme.colors.danger,
          fg: theme.colors.textInverse,
          border: theme.colors.danger,
        };
      case 'primary':
      default:
        return {
          bg: theme.colors.primary,
          fg: theme.colors.textInverse,
          border: theme.colors.primary,
        };
    }
  })();

  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderRadius: theme.radius.md,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          opacity: isDisabled ? 0.6 : pressed ? 0.85 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.row}>
          {iconLeft ? <View style={{ marginRight: theme.spacing.sm }}>{iconLeft}</View> : null}
          <Text style={[theme.typography.bodyStrong, { color: palette.fg }]}>{label}</Text>
          {iconRight ? <View style={{ marginLeft: theme.spacing.sm }}>{iconRight}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
