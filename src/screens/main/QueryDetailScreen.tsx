import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { HomeStackParamList, QueriesStackParamList } from '../../navigation/types';
import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { Skeleton } from '../../components/Skeleton';
import { ApiError } from '../../services/api';
import { getQueryById } from '../../services/satellite';
import { useTheme } from '../../hooks/useTheme';
import {
  isLandUseResult,
  isNdviResult,
  LandUseResult,
  NdviResult,
  SatelliteQuery,
} from '../../types';
import {
  formatAbsoluteDate,
  formatCoordinate,
  formatNdvi,
  formatPercent,
} from '../../utils/formatters';

type Props =
  | NativeStackScreenProps<HomeStackParamList, 'QueryDetail'>
  | NativeStackScreenProps<QueriesStackParamList, 'QueryDetail'>;

export function QueryDetailScreen({ route, navigation }: Props) {
  const { theme } = useTheme();
  const { queryId, inline } = route.params;
  const [query, setQuery] = useState<SatelliteQuery | null>(inline ?? null);
  const [loading, setLoading] = useState(!inline);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (inline) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getQueryById(queryId);
        if (!cancelled) {
          if (data) {
            setQuery(data);
          } else {
            setError('Consulta não encontrada no histórico local.');
          }
        }
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof ApiError
              ? caught.detail
              : 'Não foi possível carregar a consulta.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [inline, queryId]);

  function onSaveAsFavorite() {
    if (!query) return;
    const ndvi = isNdviResult(query.result) ? query.result.ndvi : undefined;
    const params = {
      coordinate: query.coordinate,
      alias: `Área ${formatCoordinate(query.coordinate, 2)}`,
      ...(ndvi !== undefined ? { ndvi } : {}),
    };
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('FavoritesTab', {
        screen: 'NewFavorite',
        params,
      });
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bg }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={{ alignSelf: 'flex-start' }}
        >
          <Feather name="arrow-left" size={22} color={theme.colors.text} />
        </Pressable>

        {loading ? (
          <Card>
            <Skeleton width="60%" height={22} />
            <View style={{ height: theme.spacing.sm }} />
            <Skeleton width="40%" height={14} />
            <View style={{ height: theme.spacing.md }} />
            <Skeleton width="100%" height={120} />
          </Card>
        ) : error ? (
          <Alert tone="error" title="Falha" message={error} />
        ) : query ? (
          <>
            <View>
              <Chip
                label={query.endpoint === 'vegetation' ? 'Vegetação' : 'Uso do solo'}
                selected
                tone={query.endpoint === 'vegetation' ? 'accent' : 'primary'}
              />
              <Text
                style={[
                  theme.typography.display,
                  { color: theme.colors.text, marginTop: theme.spacing.md },
                ]}
              >
                {formatCoordinate(query.coordinate, 4)}
              </Text>
              <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
                Executada em {formatAbsoluteDate(query.executedAt)}
              </Text>
            </View>

            {isLandUseResult(query.result) ? (
              <LandUseDetail result={query.result} />
            ) : isNdviResult(query.result) ? (
              <VegetationDetail result={query.result} />
            ) : null}

            <Button
              label="Salvar como favorito"
              variant="secondary"
              onPress={onSaveAsFavorite}
              iconLeft={<Feather name="star" size={16} color={theme.colors.text} />}
            />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

type LandUseDetailProps = { result: LandUseResult };

function LandUseDetail({ result }: LandUseDetailProps) {
  const { theme } = useTheme();
  const segments = [
    { label: 'Vegetação', value: result.vegetation, color: theme.colors.accent },
    { label: 'Urbano', value: result.urban, color: theme.colors.primary },
    { label: 'Água', value: result.water, color: '#3B82F6' },
    { label: 'Solo exposto', value: result.bareSoil, color: theme.colors.warning },
  ];
  const total = segments.reduce((acc, s) => acc + s.value, 0) || 1;

  return (
    <>
      <Card>
        <Text style={[theme.typography.subtitle, { color: theme.colors.text }]}>
          Distribuição do uso do solo
        </Text>
        <View
          style={[
            styles.bar,
            { backgroundColor: theme.colors.surfaceAlt, marginTop: theme.spacing.md },
          ]}
        >
          {segments.map((s) => (
            <View
              key={s.label}
              style={{
                width: `${(s.value / total) * 100}%`,
                height: '100%',
                backgroundColor: s.color,
              }}
            />
          ))}
        </View>
        <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
          {segments.map((s) => (
            <View key={s.label} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: s.color }]} />
              <Text style={[theme.typography.body, { color: theme.colors.text, flex: 1 }]}>
                {s.label}
              </Text>
              <Text style={[theme.typography.bodyStrong, { color: theme.colors.text }]}>
                {formatPercent(s.value)}
              </Text>
            </View>
          ))}
        </View>
      </Card>
      <View style={[styles.grid, { gap: theme.spacing.md }]}>
        {segments.map((s) => (
          <Card key={s.label} style={styles.gridItem}>
            <View style={[styles.legendDot, { backgroundColor: s.color, marginBottom: 8 }]} />
            <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>
              {s.label}
            </Text>
            <Text style={[theme.typography.title, { color: theme.colors.text }]}>
              {formatPercent(s.value)}
            </Text>
          </Card>
        ))}
      </View>
    </>
  );
}

type VegetationDetailProps = { result: NdviResult };

function VegetationDetail({ result }: VegetationDetailProps) {
  const { theme } = useTheme();
  const clamped = Math.max(-1, Math.min(1, result.ndvi));
  const position = ((clamped + 1) / 2) * 100;

  return (
    <Card>
      <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>
        NDVI
      </Text>
      <Text style={[theme.typography.display, { color: theme.colors.accent }]}>
        {formatNdvi(result.ndvi)}
      </Text>
      <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
        Fonte {result.source} · captura {formatAbsoluteDate(result.capturedAt)}
      </Text>

      <View style={{ marginTop: theme.spacing.lg }}>
        <View style={styles.scaleTrack}>
          <View style={[styles.scaleTrack, styles.scaleGradient]}>
            <View style={[styles.scaleSegment, { backgroundColor: '#92400E' }]} />
            <View style={[styles.scaleSegment, { backgroundColor: '#CA8A04' }]} />
            <View style={[styles.scaleSegment, { backgroundColor: '#65A30D' }]} />
            <View style={[styles.scaleSegment, { backgroundColor: '#16A34A' }]} />
            <View style={[styles.scaleSegment, { backgroundColor: '#15803D' }]} />
          </View>
          <View
            style={[
              styles.scaleMarker,
              {
                left: `${position}%`,
                borderColor: theme.colors.text,
                backgroundColor: theme.colors.surface,
              },
            ]}
          />
        </View>
        <View style={styles.scaleLabels}>
          <Text style={[theme.typography.micro, { color: theme.colors.textMuted }]}>-1</Text>
          <Text style={[theme.typography.micro, { color: theme.colors.textMuted }]}>0</Text>
          <Text style={[theme.typography.micro, { color: theme.colors.textMuted }]}>+1</Text>
        </View>
      </View>

      <Text
        style={[
          theme.typography.body,
          { color: theme.colors.text, marginTop: theme.spacing.lg },
        ]}
      >
        {describeNdvi(result.ndvi)}
      </Text>
    </Card>
  );
}

function describeNdvi(value: number): string {
  if (value < 0) return 'Superfície sem vegetação — possível corpo d\'água, neve ou nuvem.';
  if (value < 0.2) return 'Solo exposto ou vegetação muito esparsa.';
  if (value < 0.4) return 'Vegetação rala ou estresse hídrico.';
  if (value < 0.6) return 'Vegetação moderada, típica de pastagens ou cultivos.';
  if (value < 0.8) return 'Vegetação densa e saudável.';
  return 'Cobertura vegetal muito densa, típica de mata fechada.';
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  bar: {
    flexDirection: 'row',
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    flexGrow: 1,
    flexBasis: '45%',
  },
  scaleTrack: {
    height: 14,
    borderRadius: 7,
    overflow: 'visible',
  },
  scaleGradient: {
    flexDirection: 'row',
    borderRadius: 7,
    overflow: 'hidden',
  },
  scaleSegment: {
    flex: 1,
    height: '100%',
  },
  scaleMarker: {
    position: 'absolute',
    top: -4,
    width: 14,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    transform: [{ translateX: -7 }],
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
});
