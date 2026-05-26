import React from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
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
import { Skeleton } from '../../components/Skeleton';
import { useApi } from '../../hooks/useApi';
import { useTheme } from '../../hooks/useTheme';
import { getApod } from '../../services/nasaApi';
import { formatAbsoluteDate } from '../../utils/formatters';

type Props = NativeStackScreenProps<HomeStackParamList, 'Apod'>;

export function ApodScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const apod = useApi(() => getApod());

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bg }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}
        refreshControl={
          <RefreshControl
            refreshing={apod.loading}
            onRefresh={apod.refetch}
            tintColor={theme.colors.primary}
          />
        }
      >
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={{ alignSelf: 'flex-start' }}
        >
          <Feather name="arrow-left" size={22} color={theme.colors.text} />
        </Pressable>

        <View>
          <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>
            NASA · Astronomy Picture of the Day
          </Text>
          <Text
            style={[
              theme.typography.title,
              { color: theme.colors.text, marginTop: theme.spacing.xs },
            ]}
          >
            {apod.data?.title ?? 'Carregando…'}
          </Text>
          {apod.data ? (
            <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>
              {formatAbsoluteDate(apod.data.date)}
              {apod.data.copyright ? ` · ${apod.data.copyright}` : ''}
            </Text>
          ) : null}
        </View>

        {apod.error ? (
          <Alert tone="error" title="Falha ao carregar" message={apod.error.detail} />
        ) : null}

        {apod.loading ? (
          <>
            <Skeleton height={240} radius={theme.radius.lg} />
            <Skeleton width="100%" height={14} />
            <Skeleton width="90%" height={14} />
            <Skeleton width="80%" height={14} />
          </>
        ) : apod.data ? (
          <>
            {apod.data.mediaType === 'image' ? (
              <Image
                source={{ uri: apod.data.hdurl ?? apod.data.url }}
                style={[styles.image, { borderRadius: theme.radius.lg }]}
                resizeMode="cover"
              />
            ) : (
              <Card>
                <Text style={[theme.typography.body, { color: theme.colors.text }]}>
                  Mídia do dia em formato de vídeo. Abra o link a seguir:
                </Text>
                <Text
                  style={[
                    theme.typography.bodyStrong,
                    { color: theme.colors.primary, marginTop: theme.spacing.sm },
                  ]}
                  selectable
                >
                  {apod.data.url}
                </Text>
              </Card>
            )}
            <Card>
              <Text style={[theme.typography.body, { color: theme.colors.text, lineHeight: 22 }]}>
                {apod.data.explanation}
              </Text>
            </Card>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 260,
  },
});
