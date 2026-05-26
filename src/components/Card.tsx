import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';

type CardProps = {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  onLongPress?: () => void;
  padded?: boolean;
};

export function Card({ children, style, onPress, onLongPress, padded = true }: CardProps) {
  const { theme } = useTheme();
  const baseStyle = [
    styles.base,
    {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.lg,
      padding: padded ? theme.spacing.lg : 0,
    },
    style,
  ];

  if (onPress || onLongPress) {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => [
          ...baseStyle,
          pressed && { opacity: 0.85 },
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={baseStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
  },
});
