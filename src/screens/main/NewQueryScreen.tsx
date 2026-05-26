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
import { HomeStackParamList } from '../../navigation/types';
import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { CoordinateInput } from '../../components/CoordinateInput';
import { useTheme } from '../../hooks/useTheme';
import { ApiError } from '../../services/api';
import { getLandUse, getVegetation } from '../../services/satellite';
import { QueryEndpoint, SatelliteQuery } from '../../types';
import {
  parseCoordinate,
  validateLatitude,
  validateLongitude,
} from '../../utils/validators';

type Props = NativeStackScreenProps<HomeStackParamList, 'NewQuery'>;

export function NewQueryScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const initial = route.params?.coordinate;
  const [endpoint, setEndpoint] = useState<QueryEndpoint>(route.params?.endpoint ?? 'landuse');
  const [lat, setLat] = useState(initial ? String(initial.lat) : '');
  const [lng, setLng] = useState(initial ? String(initial.lng) : '');
  const [latError, setLatError] = useState<string | null>(null);
  const [lngError, setLngError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  async function onSubmit() {
    setApiError(null);
    const latCheck = validateLatitude(lat);
    const lngCheck = validateLongitude(lng);
    setLatError(latCheck.valid ? null : latCheck.message ?? null);
    setLngError(lngCheck.valid ? null : lngCheck.message ?? null);
    if (!latCheck.valid || !lngCheck.valid) return;

    const coord = parseCoordinate(lat, lng);
    if (!coord) return;

    setSubmitting(true);
    try {
      const result =
        endpoint === 'landuse' ? await getLandUse(coord) : await getVegetation(coord);
      const synthetic: SatelliteQuery = {
        id: `local-${Date.now()}`,
        coordinate: coord,
        endpoint,
        result,
        executedAt: new Date().toISOString(),
      };
      navigation.replace('QueryDetail', { queryId: synthetic.id, inline: synthetic });
    } catch (caught) {
      const message =
        caught instanceof ApiError ? caught.detail : 'Não foi possível executar a consulta.';
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
        <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={8}
            style={{ alignSelf: 'flex-start', marginBottom: theme.spacing.lg }}
          >
            <Feather name="arrow-left" size={22} color={theme.colors.text} />
          </Pressable>

          <Text style={[theme.typography.display, { color: theme.colors.text }]}>
            Nova consulta
          </Text>
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.textMuted, marginTop: theme.spacing.xs },
            ]}
          >
            Escolha o tipo de análise e a coordenada que você quer monitorar.
          </Text>

          <View style={[styles.tabs, { marginTop: theme.spacing.xl, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceAlt }]}>
            <TabButton
              label="Uso do solo"
              active={endpoint === 'landuse'}
              onPress={() => setEndpoint('landuse')}
            />
            <TabButton
              label="Vegetação (NDVI)"
              active={endpoint === 'vegetation'}
              onPress={() => setEndpoint('vegetation')}
            />
          </View>

          <View style={{ marginTop: theme.spacing.xl }}>
            <CoordinateInput
              lat={lat}
              lng={lng}
              onChangeLat={setLat}
              onChangeLng={setLng}
              latError={latError}
              lngError={lngError}
              disabled={submitting}
            />
          </View>

          <Card style={{ marginTop: theme.spacing.lg }}>
            <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>
              O que você vai receber
            </Text>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.text, marginTop: theme.spacing.xs },
              ]}
            >
              {endpoint === 'landuse'
                ? 'Distribuição percentual de vegetação, área urbana, água e solo exposto.'
                : 'Índice de vegetação por diferença normalizada (NDVI) entre -1 e 1, com fonte e data.'}
            </Text>
          </Card>

          {apiError ? (
            <View style={{ marginTop: theme.spacing.lg }}>
              <Alert tone="error" title="Falha na consulta" message={apiError} />
            </View>
          ) : null}

          <View style={{ marginTop: theme.spacing.xl }}>
            <Button label="Consultar" onPress={onSubmit} loading={submitting} fullWidth />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type TabButtonProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function TabButton({ label, active, onPress }: TabButtonProps) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tab,
        {
          backgroundColor: active ? theme.colors.surface : 'transparent',
          borderRadius: theme.radius.md,
        },
      ]}
    >
      <Text
        style={[
          theme.typography.bodyStrong,
          { color: active ? theme.colors.primary : theme.colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
});
