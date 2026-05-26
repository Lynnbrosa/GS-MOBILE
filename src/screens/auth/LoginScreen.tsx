import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/types';
import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { ApiError } from '../../services/api';
import { validateEmail } from '../../utils/validators';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  async function onSubmit() {
    setApiError(null);
    const emailCheck = validateEmail(email);
    setEmailError(emailCheck.valid ? null : emailCheck.message ?? null);
    if (!password) {
      setPasswordError('Informe sua senha.');
    } else {
      setPasswordError(null);
    }
    if (!emailCheck.valid || !password) return;

    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (caught) {
      const message = caught instanceof ApiError ? caught.detail : 'Não foi possível entrar.';
      setApiError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bg }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { padding: theme.spacing.xl }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brand}>
            <View
              style={[
                styles.logoBadge,
                {
                  backgroundColor: theme.colors.primarySoft,
                  borderRadius: theme.radius.lg,
                },
              ]}
            >
              <Feather name="globe" size={32} color={theme.colors.primary} />
            </View>
            <Text
              style={[
                theme.typography.display,
                { color: theme.colors.text, marginTop: theme.spacing.lg },
              ]}
            >
              OrbittAPI
            </Text>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textMuted, marginTop: theme.spacing.xs },
              ]}
            >
              Dados satelitais para decisões em terra.
            </Text>
          </View>

          <View style={{ marginTop: theme.spacing.xxl, gap: theme.spacing.md }}>
            <Input
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="voce@exemplo.com"
              error={emailError}
              iconLeft={<Feather name="mail" size={18} color={theme.colors.textMuted} />}
            />
            <Input
              label="Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              secureToggle
              placeholder="Sua senha"
              error={passwordError}
              iconLeft={<Feather name="lock" size={18} color={theme.colors.textMuted} />}
            />

            {apiError ? <Alert tone="error" title="Não foi possível entrar" message={apiError} /> : null}

            <Button label="Entrar" onPress={onSubmit} loading={submitting} fullWidth />

            <View style={[styles.footerRow, { marginTop: theme.spacing.md }]}>
              <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
                Não tem conta?{' '}
              </Text>
              <Pressable onPress={() => navigation.navigate('Register')} hitSlop={8}>
                <Text style={[theme.typography.bodyStrong, { color: theme.colors.primary }]}>
                  Cadastre-se
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  brand: {
    alignItems: 'center',
  },
  logoBadge: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
