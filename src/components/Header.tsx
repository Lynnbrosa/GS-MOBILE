import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

type HeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function Header({ title, subtitle, action }: HeaderProps) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.md,
        },
      ]}
    >
      <View style={styles.textWrap}>
        <Text style={[theme.typography.title, { color: theme.colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.textMuted, marginTop: theme.spacing.xs },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textWrap: {
    flex: 1,
  },
  action: {
    marginLeft: 12,
  },
});
