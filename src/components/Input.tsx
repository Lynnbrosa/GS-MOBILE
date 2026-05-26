import React, { forwardRef, ReactNode, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

type InputProps = TextInputProps & {
  label?: string;
  helper?: string;
  error?: string | null;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  secureToggle?: boolean;
  containerStyle?: ViewStyle;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    helper,
    error,
    iconLeft,
    iconRight,
    secureToggle,
    containerStyle,
    secureTextEntry,
    onFocus,
    onBlur,
    style,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry ?? false);

  const borderColor = error
    ? theme.colors.danger
    : focused
      ? theme.colors.primary
      : theme.colors.border;

  return (
    <View style={containerStyle}>
      {label ? (
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textMuted, marginBottom: theme.spacing.xs },
          ]}
        >
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.field,
          {
            backgroundColor: theme.colors.surface,
            borderColor,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.spacing.md,
          },
        ]}
      >
        {iconLeft ? <View style={{ marginRight: theme.spacing.sm }}>{iconLeft}</View> : null}
        <TextInput
          ref={ref}
          {...rest}
          secureTextEntry={hidden}
          placeholderTextColor={theme.colors.textMuted}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[
            styles.input,
            theme.typography.body,
            { color: theme.colors.text },
            style,
          ]}
        />
        {secureToggle ? (
          <Pressable onPress={() => setHidden((prev) => !prev)} hitSlop={8}>
            <Feather
              name={hidden ? 'eye' : 'eye-off'}
              size={18}
              color={theme.colors.textMuted}
            />
          </Pressable>
        ) : iconRight ? (
          <View style={{ marginLeft: theme.spacing.sm }}>{iconRight}</View>
        ) : null}
      </View>
      {error ? (
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.danger, marginTop: theme.spacing.xs },
          ]}
        >
          {error}
        </Text>
      ) : helper ? (
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textMuted, marginTop: theme.spacing.xs },
          ]}
        >
          {helper}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
  },
});
