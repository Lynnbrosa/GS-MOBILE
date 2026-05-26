import React, { useCallback } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { HomeStackParamList, MainTabsParamList } from '../../navigation/types';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Skeleton } from '../../components/Skeleton';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useApi } from '../../hooks/useApi';
import { useFavorites } from '../../hooks/useFavorites';
import { getCurrentWeather, describeWeatherCode, weatherIconName } from '../../services/weatherApi';
import { getApod, getActiveSpaceEvents } from '../../services/nasaApi';
import { getQueries } from '../../services/satellite';
import { ApodPicture, isLandUseResult, isNdviResult, SatelliteQuery } from '../../types';
import {
  formatCoordinate,
  formatHumidity,
  formatNdvi,
  formatPercent,
  formatRelativeDate,
  formatTemperature,
  greetByHour,
} from '../../utils/formatters';

type Props = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'HomeMain'>,
  BottomTabScreenProps<MainTabsParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { favorites } = useFavorites();

  const weather = useApi(() => getCurrentWeather());
  const lastQuery = useApi(() => getQueries(1, 1));
  const apod = useApi(() => getApod());
  const spaceEvents = useApi(() => getActiveSpaceEvents(5));

  const onRefresh = useCallback(async () => {
    await Promise.all([weather.refetch(), lastQuery.refetch(), apod.refetch(), spaceEvents.refetch()]);
  }, [weather, lastQuery, apod, spaceEvents]);

  const recentFavorites = favorites.slice(0, 3);
  const monthly = lastQuery.data?.total ?? 0;
  const quotaPct = Math.min(100, Math.round((monthly / 50) * 100));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bg }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl }}
        refreshControl={
          <RefreshControl
            refreshing={weather.loading || lastQuery.loading}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={{ marginBottom: theme.spacing.lg }}>
          <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
            {greetByHour()},
          </Text>
          <Text style={[theme.typography.display, { color: theme.colors.text }]}>
            {user?.name?.split(' ')[0] ?? 'Operador'}
          </Text>
        </View>

        <WeatherCard
          data={weather.data}
          loading={weather.loading}
          error={weather.error?.detail ?? null}
        />

        <View style={{ height: theme.spacing.md }} />

        <ApodCard
          data={apod.data}
          loading={apod.loading}
          onPress={() => navigation.navigate('Apod')}
        />

        <View style={{ height: theme.spacing.md }} />

        <Card onPress={() => navigation.navigate('Events')}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={[theme.typography.subtitle, { color: theme.colors.text }]}>
                Eventos vistos do espaço
              </Text>
              <Text
                style={[
                  theme.typography.body,
                  { color: theme.colors.textMuted, marginTop: theme.spacing.xs },
                ]}
              >
                {spaceEvents.loading
                  ? 'Carregando dados da NASA EONET…'
                  : spaceEvents.error
                    ? 'Não foi possível consultar a NASA agora.'
                    : `${spaceEvents.data?.length ?? 0} eventos naturais ativos rastreados por satélite.`}
              </Text>
            </View>
            <View
              style={[
                styles.iconBadge,
                {
                  backgroundColor: theme.colors.accentSoft,
                  borderRadius: theme.radius.pill,
                },
              ]}
            >
              <Feather name="globe" size={20} color={theme.colors.accent} />
            </View>
          </View>
        </Card>

        <View style={{ height: theme.spacing.md }} />

        <Card>
          <View style={styles.rowBetween}>
            <Text style={[theme.typography.subtitle, { color: theme.colors.text }]}>
              Última consulta
            </Text>
            <Feather name="activity" size={18} color={theme.colors.textMuted} />
          </View>
          {lastQuery.loading ? (
            <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
              <Skeleton width="60%" height={18} />
              <Skeleton width="40%" height={14} />
              <Skeleton width="80%" height={14} />
            </View>
          ) : lastQuery.data?.items[0] ? (
            <LastQueryPreview
              query={lastQuery.data.items[0]}
              onPress={() =>
                navigation.navigate('QueryDetail', { queryId: lastQuery.data!.items[0]!.id })
              }
            />
          ) : (
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textMuted, marginTop: theme.spacing.md },
              ]}
            >
              Você ainda não fez consultas. Use o botão abaixo para começar.
            </Text>
          )}
        </Card>

        <View style={{ height: theme.spacing.md }} />

        <Card>
          <View style={styles.rowBetween}>
            <Text style={[theme.typography.subtitle, { color: theme.colors.text }]}>
              Áreas favoritas
            </Text>
            <Feather name="star" size={18} color={theme.colors.textMuted} />
          </View>
          {recentFavorites.length === 0 ? (
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textMuted, marginTop: theme.spacing.md },
              ]}
            >
              Salve áreas que você acompanha para acessar rapidamente.
            </Text>
          ) : (
            <FlatList
              data={recentFavorites}
              horizontal
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.favCard,
                    {
                      backgroundColor: theme.colors.surfaceAlt,
                      borderRadius: theme.radius.md,
                      padding: theme.spacing.md,
                    },
                  ]}
                >
                  <Text
                    style={[theme.typography.bodyStrong, { color: theme.colors.text }]}
                    numberOfLines={1}
                  >
                    {item.alias}
                  </Text>
                  <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>
                    {formatCoordinate(item.coordinate, 3)}
                  </Text>
                  {item.lastNdvi !== undefined ? (
                    <Text
                      style={[
                        theme.typography.caption,
                        { color: theme.colors.accent, marginTop: theme.spacing.xs },
                      ]}
                    >
                      NDVI {formatNdvi(item.lastNdvi)}
                    </Text>
                  ) : null}
                </View>
              )}
            />
          )}
        </Card>

        <View style={{ height: theme.spacing.md }} />

        <Card>
          <View style={styles.rowBetween}>
            <View>
              <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>
                Consultas no mês
              </Text>
              <Text style={[theme.typography.title, { color: theme.colors.text }]}>{monthly}</Text>
            </View>
            <View
              style={[
                styles.quotaBadge,
                {
                  backgroundColor: theme.colors.primarySoft,
                  borderRadius: theme.radius.pill,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: 6,
                },
              ]}
            >
              <Text style={[theme.typography.caption, { color: theme.colors.primary, fontWeight: '700' }]}>
                {quotaPct}% da cota
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.quotaTrack,
              {
                backgroundColor: theme.colors.surfaceAlt,
                borderRadius: theme.radius.pill,
                marginTop: theme.spacing.md,
              },
            ]}
          >
            <View
              style={[
                styles.quotaFill,
                {
                  backgroundColor: theme.colors.primary,
                  width: `${quotaPct}%`,
                  borderRadius: theme.radius.pill,
                },
              ]}
            />
          </View>
        </Card>

        <View style={{ height: theme.spacing.xl }} />

        <Button
          label="Nova consulta"
          onPress={() => navigation.navigate('NewQuery')}
          iconLeft={<Feather name="plus" size={18} color={theme.colors.textInverse} />}
          fullWidth
        />
      </ScrollView>
    </SafeAreaView>
  );
}

type WeatherCardProps = {
  data: { temperature: number; humidity: number; weatherCode: number; fetchedAt: string } | null;
  loading: boolean;
  error: string | null;
};

function WeatherCard({ data, loading, error }: WeatherCardProps) {
  const { theme } = useTheme();
  return (
    <Card>
      <View style={styles.rowBetween}>
        <Text style={[theme.typography.subtitle, { color: theme.colors.text }]}>
          Clima em São Paulo
        </Text>
        <Feather
          name={data ? (weatherIconName(data.weatherCode) as keyof typeof Feather.glyphMap) : 'cloud'}
          size={22}
          color={theme.colors.primary}
        />
      </View>
      {loading ? (
        <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
          <Skeleton width={140} height={32} />
          <Skeleton width="50%" height={14} />
        </View>
      ) : error ? (
        <Text
          style={[
            theme.typography.body,
            { color: theme.colors.textMuted, marginTop: theme.spacing.md },
          ]}
        >
          Clima indisponível: {error}
        </Text>
      ) : data ? (
        <View style={{ marginTop: theme.spacing.md }}>
          <Text style={[theme.typography.display, { color: theme.colors.text }]}>
            {formatTemperature(data.temperature)}
          </Text>
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.textMuted, marginTop: theme.spacing.xs },
            ]}
          >
            {describeWeatherCode(data.weatherCode)} · Umidade {formatHumidity(data.humidity)}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

type ApodCardProps = {
  data: ApodPicture | null;
  loading: boolean;
  onPress: () => void;
};

function ApodCard({ data, loading, onPress }: ApodCardProps) {
  const { theme } = useTheme();
  return (
    <Card onPress={onPress} padded={false}>
      <View style={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.md }}>
        <View style={styles.rowBetween}>
          <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>
            NASA · Foto do dia
          </Text>
          <Feather name="external-link" size={16} color={theme.colors.textMuted} />
        </View>
        <Text
          style={[
            theme.typography.subtitle,
            { color: theme.colors.text, marginTop: theme.spacing.xs },
          ]}
          numberOfLines={2}
        >
          {loading ? 'Carregando…' : (data?.title ?? 'Indisponível agora')}
        </Text>
      </View>
      {loading ? (
        <Skeleton height={160} radius={0} />
      ) : data?.mediaType === 'image' ? (
        <Image
          source={{ uri: data.url }}
          style={styles.apodImage}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.apodPlaceholder,
            { backgroundColor: theme.colors.surfaceAlt },
          ]}
        >
          <Feather name="video" size={32} color={theme.colors.textMuted} />
        </View>
      )}
    </Card>
  );
}

type LastQueryPreviewProps = {
  query: SatelliteQuery;
  onPress: () => void;
};

function LastQueryPreview({ query, onPress }: LastQueryPreviewProps) {
  const { theme } = useTheme();
  return (
    <View style={{ marginTop: theme.spacing.md }}>
      <Text style={[theme.typography.bodyStrong, { color: theme.colors.text }]}>
        {query.endpoint === 'vegetation' ? 'Vegetação (NDVI)' : 'Uso do solo'}
      </Text>
      <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>
        {formatCoordinate(query.coordinate)} · {formatRelativeDate(query.executedAt)}
      </Text>
      <Text
        style={[theme.typography.body, { color: theme.colors.text, marginTop: theme.spacing.sm }]}
      >
        {isNdviResult(query.result)
          ? `NDVI ${formatNdvi(query.result.ndvi)} (${query.result.source})`
          : isLandUseResult(query.result)
            ? `Vegetação ${formatPercent(query.result.vegetation)} · Urbano ${formatPercent(query.result.urban)}`
            : ''}
      </Text>
      <View style={{ marginTop: theme.spacing.md }}>
        <Button label="Ver detalhes" variant="ghost" onPress={onPress} />
      </View>
    </View>
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
  favCard: {
    width: 180,
  },
  quotaBadge: {
    alignSelf: 'flex-start',
  },
  quotaTrack: {
    height: 8,
    overflow: 'hidden',
  },
  quotaFill: {
    height: '100%',
  },
  iconBadge: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apodImage: {
    width: '100%',
    height: 160,
  },
  apodPlaceholder: {
    width: '100%',
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
