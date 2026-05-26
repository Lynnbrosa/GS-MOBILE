import React from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { HomeStackParamList } from '../../navigation/types';
import { Alert } from '../../components/Alert';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { useApi } from '../../hooks/useApi';
import { useTheme } from '../../hooks/useTheme';
import {
  categoryIcon,
  categoryLabelPt,
  getActiveSpaceEvents,
} from '../../services/nasaApi';
import { SpaceEvent } from '../../types';
import { formatRelativeDate } from '../../utils/formatters';

type Props = NativeStackScreenProps<HomeStackParamList, 'Events'>;

export function EventsScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const events = useApi(() => getActiveSpaceEvents(30));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bg }]} edges={['top']}>
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.lg,
            paddingBottom: theme.spacing.md,
          },
        ]}
      >
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={theme.colors.text} />
        </Pressable>
        <View style={{ marginTop: theme.spacing.md }}>
          <Text style={[theme.typography.title, { color: theme.colors.text }]}>
            Eventos vistos do espaço
          </Text>
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.textMuted, marginTop: theme.spacing.xs },
            ]}
          >
            Dados do EONET, sistema da NASA que rastreia eventos naturais a partir de satélites.
          </Text>
        </View>
      </View>

      {events.error ? (
        <View style={{ padding: theme.spacing.lg }}>
          <Alert tone="error" title="Falha ao carregar" message={events.error.detail} />
        </View>
      ) : null}

      <FlatList
        data={events.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={events.loading}
            onRefresh={events.refetch}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          events.loading ? (
            <View style={{ gap: theme.spacing.md }}>
              {[0, 1, 2, 3].map((i) => (
                <Card key={i}>
                  <Skeleton width="60%" height={18} />
                  <View style={{ height: theme.spacing.sm }} />
                  <Skeleton width="40%" height={14} />
                  <View style={{ height: theme.spacing.sm }} />
                  <Skeleton width="100%" height={14} />
                </Card>
              ))}
            </View>
          ) : (
            <EmptyState
              icon="globe"
              title="Sem eventos ativos"
              description="A API EONET não retornou eventos em aberto no momento."
            />
          )
        }
        renderItem={({ item }) => <EventCard event={item} />}
      />
    </SafeAreaView>
  );
}

type EventCardProps = {
  event: SpaceEvent;
};

function EventCard({ event }: EventCardProps) {
  const { theme } = useTheme();
  const category = event.categories[0];
  const lastGeometry = event.geometries[event.geometries.length - 1];
  const coords = lastGeometry?.type === 'Point' ? (lastGeometry.coordinates as number[]) : null;

  return (
    <Card
      onPress={
        event.link
          ? () => {
              Linking.openURL(event.link!).catch(() => undefined);
            }
          : undefined
      }
    >
      <View style={styles.row}>
        <View
          style={[
            styles.iconBadge,
            {
              backgroundColor: theme.colors.primarySoft,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          <Feather
            name={
              (category
                ? categoryIcon(category.id)
                : 'globe') as keyof typeof Feather.glyphMap
            }
            size={20}
            color={theme.colors.primary}
          />
        </View>
        <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
          <Text style={[theme.typography.bodyStrong, { color: theme.colors.text }]} numberOfLines={2}>
            {event.title}
          </Text>
          {lastGeometry ? (
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textMuted, marginTop: 2 },
              ]}
            >
              Atualizado {formatRelativeDate(lastGeometry.date)}
            </Text>
          ) : null}
        </View>
      </View>
      <View
        style={[
          styles.row,
          { marginTop: theme.spacing.md, flexWrap: 'wrap', gap: theme.spacing.xs },
        ]}
      >
        {event.categories.map((c) => (
          <Chip key={c.id} label={categoryLabelPt(c.id, c.title)} selected tone="primary" />
        ))}
        {coords ? (
          <Chip
            label={`${coords[1]?.toFixed(2)}, ${coords[0]?.toFixed(2)}`}
            tone="accent"
          />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
