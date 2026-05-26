import React from 'react';
import { Alert as RNAlert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { FavoritesStackParamList, MainTabsParamList } from '../../navigation/types';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Header } from '../../components/Header';
import { useFavorites } from '../../hooks/useFavorites';
import { useTheme } from '../../hooks/useTheme';
import { Favorite } from '../../types';
import {
  formatAbsoluteDate,
  formatCoordinate,
  formatNdvi,
  formatRelativeDate,
} from '../../utils/formatters';

type Props = CompositeScreenProps<
  NativeStackScreenProps<FavoritesStackParamList, 'FavoritesMain'>,
  BottomTabScreenProps<MainTabsParamList>
>;

export function FavoritesScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { favorites, remove } = useFavorites();

  function confirmRemove(favorite: Favorite) {
    RNAlert.alert(
      'Remover favorito',
      `Excluir "${favorite.alias}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => remove(favorite.id) },
      ],
      { cancelable: true },
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bg }]} edges={['top']}>
      <Header
        title="Favoritos"
        subtitle={`${favorites.length} ${favorites.length === 1 ? 'área salva' : 'áreas salvas'}`}
      />

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <EmptyState
            icon="star"
            title="Sem favoritos ainda"
            description="Salve áreas que você acompanha. Toque no botão abaixo para adicionar a primeira."
            actionLabel="Adicionar favorito"
            onAction={() => navigation.navigate('NewFavorite')}
          />
        }
        renderItem={({ item }) => (
          <Card
            onPress={() => navigation.navigate('NewFavorite', { alias: item.alias, coordinate: item.coordinate })}
            onLongPress={() => confirmRemove(item)}
          >
            <View style={styles.rowBetween}>
              <Text style={[theme.typography.subtitle, { color: theme.colors.text }]} numberOfLines={1}>
                {item.alias}
              </Text>
              <Pressable onPress={() => confirmRemove(item)} hitSlop={12}>
                <Feather name="trash-2" size={18} color={theme.colors.danger} />
              </Pressable>
            </View>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textMuted, marginTop: theme.spacing.xs },
              ]}
            >
              {formatCoordinate(item.coordinate)}
            </Text>
            {item.lastNdvi !== undefined ? (
              <View style={[styles.rowBetween, { marginTop: theme.spacing.md }]}>
                <Text style={[theme.typography.bodyStrong, { color: theme.colors.accent }]}>
                  NDVI {formatNdvi(item.lastNdvi)}
                </Text>
                <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>
                  {item.lastCheckedAt
                    ? `Atualizado ${formatRelativeDate(item.lastCheckedAt)}`
                    : 'Sem leituras'}
                </Text>
              </View>
            ) : (
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textMuted, marginTop: theme.spacing.sm },
                ]}
              >
                Salvo em{' '}
                {item.lastCheckedAt ? formatAbsoluteDate(item.lastCheckedAt) : 'data desconhecida'}
              </Text>
            )}
          </Card>
        )}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Adicionar favorito"
        onPress={() => navigation.navigate('NewFavorite')}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: theme.colors.primary,
            opacity: pressed ? 0.85 : 1,
            shadowColor: theme.colors.text,
          },
        ]}
      >
        <Feather name="plus" size={22} color={theme.colors.textInverse} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});
