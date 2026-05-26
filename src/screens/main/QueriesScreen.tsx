import React, { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { MainTabsParamList, QueriesStackParamList } from '../../navigation/types';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { Input } from '../../components/Input';
import { Skeleton } from '../../components/Skeleton';
import { Alert } from '../../components/Alert';
import { useQueries } from '../../hooks/useQueries';
import { useTheme } from '../../hooks/useTheme';
import {
  isLandUseResult,
  isNdviResult,
  QueryEndpoint,
  QueryFilterWindow,
  SatelliteQuery,
} from '../../types';
import {
  formatCoordinate,
  formatNdvi,
  formatPercent,
  formatRelativeDate,
} from '../../utils/formatters';

type Props = CompositeScreenProps<
  NativeStackScreenProps<QueriesStackParamList, 'QueriesMain'>,
  BottomTabScreenProps<MainTabsParamList>
>;

const endpoints: { label: string; value: QueryEndpoint }[] = [
  { label: 'Uso do solo', value: 'landuse' },
  { label: 'Vegetação', value: 'vegetation' },
];

const windows: { label: string; value: QueryFilterWindow }[] = [
  { label: '7 dias', value: 7 },
  { label: '30 dias', value: 30 },
  { label: '90 dias', value: 90 },
];

export function QueriesScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const {
    items,
    loading,
    refreshing,
    refetch,
    loadMore,
    loadingMore,
    error,
    filters,
    setFilters,
    total,
  } = useQueries();
  const [search, setSearch] = useState('');

  function toggleEndpoint(endpoint: QueryEndpoint) {
    setFilters({ ...filters, endpoint: filters.endpoint === endpoint ? undefined : endpoint });
  }

  function toggleWindow(window: QueryFilterWindow) {
    setFilters({ ...filters, window: filters.window === window ? undefined : window });
  }

  function applySearch(value: string) {
    setSearch(value);
    setFilters({ ...filters, search: value || undefined });
  }

  function toggleOrder() {
    const next = filters.order === 'oldest' ? 'newest' : 'oldest';
    setFilters({ ...filters, order: next });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bg }]} edges={['top']}>
      <Header title="Consultas" subtitle={`${total} registros encontrados`} />

      <View style={{ paddingHorizontal: theme.spacing.lg, gap: theme.spacing.md }}>
        <Input
          placeholder="Buscar por coordenada"
          value={search}
          onChangeText={applySearch}
          iconLeft={<Feather name="search" size={18} color={theme.colors.textMuted} />}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: theme.spacing.sm }}
        >
          {endpoints.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={filters.endpoint === option.value}
              onPress={() => toggleEndpoint(option.value)}
            />
          ))}
          {windows.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={filters.window === option.value}
              onPress={() => toggleWindow(option.value)}
              tone="accent"
            />
          ))}
          <Chip
            label={filters.order === 'oldest' ? 'Antigos primeiro' : 'Recentes primeiro'}
            selected
            onPress={toggleOrder}
            tone="primary"
          />
        </ScrollView>
      </View>

      {error ? (
        <View style={{ padding: theme.spacing.lg }}>
          <Alert tone="error" title="Falha ao carregar" message={error.detail} />
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refetch}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          loading ? (
            <View style={{ gap: theme.spacing.md }}>
              {[0, 1, 2].map((i) => (
                <Card key={i}>
                  <Skeleton width="60%" height={18} />
                  <View style={{ height: theme.spacing.sm }} />
                  <Skeleton width="40%" height={14} />
                  <View style={{ height: theme.spacing.sm }} />
                  <Skeleton width="80%" height={14} />
                </Card>
              ))}
            </View>
          ) : (
            <EmptyState
              icon="search"
              title="Sem consultas"
              description="Quando você fizer consultas no backend, elas vão aparecer aqui."
            />
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: theme.spacing.lg }}>
              <Skeleton height={80} />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <QueryListItem
            query={item}
            onPress={() => navigation.navigate('QueryDetail', { queryId: item.id })}
          />
        )}
      />
    </SafeAreaView>
  );
}

type QueryListItemProps = {
  query: SatelliteQuery;
  onPress: () => void;
};

function QueryListItem({ query, onPress }: QueryListItemProps) {
  const { theme } = useTheme();
  return (
    <Card onPress={onPress}>
      <View style={styles.rowBetween}>
        <Chip
          label={query.endpoint === 'vegetation' ? 'Vegetação' : 'Uso do solo'}
          selected
          tone={query.endpoint === 'vegetation' ? 'accent' : 'primary'}
        />
        <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>
          {formatRelativeDate(query.executedAt)}
        </Text>
      </View>
      <Text
        style={[
          theme.typography.bodyStrong,
          { color: theme.colors.text, marginTop: theme.spacing.sm },
        ]}
      >
        {formatCoordinate(query.coordinate)}
      </Text>
      <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
        {isNdviResult(query.result)
          ? `NDVI ${formatNdvi(query.result.ndvi)} (${query.result.source})`
          : isLandUseResult(query.result)
            ? `Veg ${formatPercent(query.result.vegetation)} · Urbano ${formatPercent(query.result.urban)} · Água ${formatPercent(query.result.water)}`
            : ''}
      </Text>
    </Card>
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
});
