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
import { validateEmail, validateName, validatePassword } from '../../utils/validators';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  function validate(): boolean {
    const nameCheck = validateName(name);
    const emailCheck = validateEmail(email);
    const passwordCheck = validatePassword(password);
    const confirmError = password !== confirm ? 'As senhas não conferem.' : null;
    const next = {
      name: nameCheck.valid ? null : nameCheck.message ?? null,
      email: emailCheck.valid ? null : emailCheck.message ?? null,
      password: passwordCheck.valid ? null : passwordCheck.message ?? null,
      confirm: confirmError,
    };
    setErrors(next);
    return !next.name && !next.email && !next.password && !next.confirm;
  }

  async function onSubmit() {
    setApiError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register(email.trim(), password, name.trim());
    } catch (caught) {
      const message = caught instanceof ApiError ? caught.detail : 'Não foi possível cadastrar.';
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
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={8}
            style={{ alignSelf: 'flex-start', marginBottom: theme.spacing.lg }}
          >
            <Feather name="arrow-left" size={22} color={theme.colors.text} />
          </Pressable>

          <Text style={[theme.typography.display, { color: theme.colors.text }]}>Criar conta</Text>
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.textMuted, marginTop: theme.spacing.xs },
            ]}
          >
            Cadastre-se para começar a consultar áreas no OrbittAPI.
          </Text>

          <View style={{ marginTop: theme.spacing.xl, gap: theme.spacing.md }}>
            <Input
              label="Nome"
              value={name}
              onChangeText={setName}
              placeholder="Seu nome"
              autoCapitalize="words"
              error={errors.name ?? undefined}
              iconLeft={<Feather name="user" size={18} color={theme.colors.textMuted} />}
            />
            <Input
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="voce@exemplo.com"
              error={errors.email ?? undefined}
              iconLeft={<Feather name="mail" size={18} color={theme.colors.textMuted} />}
            />
            <Input
              label="Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              secureToggle
              placeholder="Mínimo 8 caracteres"
              helper="Use ao menos 8 caracteres, uma maiúscula e um número."
              error={errors.password ?? undefined}
              iconLeft={<Feather name="lock" size={18} color={theme.colors.textMuted} />}
            />
            <Input
              label="Confirmar senha"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              secureToggle
              placeholder="Repita a senha"
              error={errors.confirm ?? undefined}
              iconLeft={<Feather name="lock" size={18} color={theme.colors.textMuted} />}
            />

            {apiError ? (
              <Alert tone="error" title="Erro no cadastro" message={apiError} />
            ) : null}

            <Button label="Criar conta" onPress={onSubmit} loading={submitting} fullWidth />

            <View style={[styles.footerRow, { marginTop: theme.spacing.md }]}>
              <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
                Já tem conta?{' '}
              </Text>
              <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8}>
                <Text style={[theme.typography.bodyStrong, { color: theme.colors.primary }]}>
                  Entre
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
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
