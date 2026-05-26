import React, { useEffect, useState } from 'react';
import {
  Alert as RNAlert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Header } from '../../components/Header';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useFavorites } from '../../hooks/useFavorites';
import { getItem, removeItem, setItem } from '../../storage/asyncStorage';
import { StorageKeys } from '../../storage/keys';
import { clearQueryHistory } from '../../services/satellite';

export function SettingsScreen() {
  const { theme, mode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { clear: clearFavorites } = useFavorites();
  const [notifications, setNotifications] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await getItem<boolean>(StorageKeys.notifications);
      if (stored !== null) {
        setNotifications(stored);
      }
    })();
  }, []);

  function onToggleNotifications(value: boolean) {
    setNotifications(value);
    setItem(StorageKeys.notifications, value).catch(() => undefined);
  }

  function confirmLogout() {
    RNAlert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => logout() },
    ]);
  }

  function confirmWipe() {
    RNAlert.alert(
      'Limpar dados locais',
      'Isso vai apagar favoritos, tema e cache. Sua conta no servidor não será afetada.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          style: 'destructive',
          onPress: () => {
            RNAlert.alert('Confirmar', 'Esta ação não pode ser desfeita.', [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Apagar tudo',
                style: 'destructive',
                onPress: async () => {
                  await clearFavorites();
                  await clearQueryHistory();
                  await removeItem(StorageKeys.theme);
                  await removeItem(StorageKeys.notifications);
                },
              },
            ]);
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bg }]} edges={['top']}>
      <Header title="Configurações" />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
        <Card>
          <View style={styles.row}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: theme.colors.primarySoft,
                  borderRadius: theme.radius.pill,
                },
              ]}
            >
              <Text style={[theme.typography.subtitle, { color: theme.colors.primary }]}>
                {(user?.name?.[0] ?? 'O').toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
              <Text style={[theme.typography.subtitle, { color: theme.colors.text }]}>
                {user?.name ?? 'Operador'}
              </Text>
              <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>
                {user?.email ?? '—'}
              </Text>
            </View>
          </View>
          <View style={{ marginTop: theme.spacing.md }}>
            <Button
              label="Sair"
              variant="destructive"
              onPress={confirmLogout}
              iconLeft={<Feather name="log-out" size={16} color={theme.colors.textInverse} />}
            />
          </View>
        </Card>

        <Card>
          <Text style={[theme.typography.subtitle, { color: theme.colors.text }]}>Aparência</Text>
          <View style={[styles.row, { marginTop: theme.spacing.md }]}>
            <Feather
              name={mode === 'dark' ? 'moon' : 'sun'}
              size={20}
              color={theme.colors.textMuted}
            />
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.text, marginLeft: theme.spacing.sm, flex: 1 },
              ]}
            >
              Tema escuro
            </Text>
            <Switch
              value={mode === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.colors.border, true: theme.colors.primarySoft }}
              thumbColor={mode === 'dark' ? theme.colors.primary : theme.colors.surface}
            />
          </View>
        </Card>

        <Card>
          <Text style={[theme.typography.subtitle, { color: theme.colors.text }]}>Preferências</Text>

          <View style={[styles.row, { marginTop: theme.spacing.md }]}>
            <Feather name="bell" size={20} color={theme.colors.textMuted} />
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.text, marginLeft: theme.spacing.sm, flex: 1 },
              ]}
            >
              Notificações
            </Text>
            <Switch
              value={notifications}
              onValueChange={onToggleNotifications}
              trackColor={{ false: theme.colors.border, true: theme.colors.primarySoft }}
              thumbColor={notifications ? theme.colors.primary : theme.colors.surface}
            />
          </View>

          <View
            style={[
              styles.row,
              {
                marginTop: theme.spacing.md,
                opacity: 0.5,
              },
            ]}
          >
            <Feather name="globe" size={20} color={theme.colors.textMuted} />
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.text, marginLeft: theme.spacing.sm, flex: 1 },
              ]}
            >
              Idioma
            </Text>
            <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>
              Português (Brasil)
            </Text>
          </View>
        </Card>

        <Card>
          <Text style={[theme.typography.subtitle, { color: theme.colors.text }]}>Sobre o app</Text>
          <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
            <KeyValue label="Versão" value="1.0.0" />
            <KeyValue label="Plataforma" value={Platform.OS} />
            <KeyValue label="ODS atendidas" value="13 (Clima) · 2 (Agricultura)" />
            <KeyValue label="Tema FIAP" value="Indústria Espacial" />
          </View>
        </Card>

        <Card>
          <Text style={[theme.typography.subtitle, { color: theme.colors.text }]}>
            Manutenção
          </Text>
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.textMuted, marginTop: theme.spacing.xs },
            ]}
          >
            Apaga favoritos, preferências e cache locais. Sua conta no backend continua intacta.
          </Text>
          <View style={{ marginTop: theme.spacing.md }}>
            <Button
              label="Limpar dados locais"
              variant="destructive"
              onPress={confirmWipe}
              iconLeft={<Feather name="trash-2" size={16} color={theme.colors.textInverse} />}
            />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

type KeyValueProps = { label: string; value: string };

function KeyValue({ label, value }: KeyValueProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.kvRow}>
      <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[theme.typography.body, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
