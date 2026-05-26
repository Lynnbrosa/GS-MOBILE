import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';

type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({ width = '100%', height = 16, radius, style }: SkeletonProps) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: theme.colors.surfaceAlt,
          borderRadius: radius ?? theme.radius.sm,
          opacity: 0.7,
        },
        style,
      ]}
    />
  );
}
