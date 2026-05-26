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
import { FavoritesStackParamList } from '../../navigation/types';
import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { CoordinateInput } from '../../components/CoordinateInput';
import { Input } from '../../components/Input';
import { useFavorites } from '../../hooks/useFavorites';
import { useTheme } from '../../hooks/useTheme';
import { ApiError } from '../../services/api';
import { getVegetation } from '../../services/satellite';
import {
  parseCoordinate,
  validateLatitude,
  validateLongitude,
} from '../../utils/validators';

type Props = NativeStackScreenProps<FavoritesStackParamList, 'NewFavorite'>;

export function NewFavoriteScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { add } = useFavorites();
  const preset = route.params;

  const [alias, setAlias] = useState(preset?.alias ?? '');
  const [lat, setLat] = useState(preset?.coordinate ? String(preset.coordinate.lat) : '');
  const [lng, setLng] = useState(preset?.coordinate ? String(preset.coordinate.lng) : '');
  const [latError, setLatError] = useState<string | null>(null);
  const [lngError, setLngError] = useState<string | null>(null);
  const [aliasError, setAliasError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [queryingNow, setQueryingNow] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  function validate(): boolean {
    let valid = true;
    if (alias.trim().length < 2) {
      setAliasError('Dê um apelido com pelo menos 2 caracteres.');
      valid = false;
    } else {
      setAliasError(null);
    }
    const latCheck = validateLatitude(lat);
    const lngCheck = validateLongitude(lng);
    setLatError(latCheck.valid ? null : latCheck.message ?? null);
    setLngError(lngCheck.valid ? null : lngCheck.message ?? null);
    if (!latCheck.valid || !lngCheck.valid) valid = false;
    return valid;
  }

  async function onSave() {
    setApiError(null);
    if (!validate()) return;
    const coord = parseCoordinate(lat, lng);
    if (!coord) return;
    setSubmitting(true);
    try {
      await add({
        alias,
        coordinate: coord,
        lastNdvi: preset?.ndvi,
        lastCheckedAt: preset?.ndvi !== undefined ? new Date().toISOString() : undefined,
      });
      navigation.goBack();
    } catch (caught) {
      setApiError(caught instanceof Error ? caught.message : 'Falha ao salvar.');
    } finally {
      setSubmitting(false);
    }
  }

  async function onQueryAndSave() {
    setApiError(null);
    if (!validate()) return;
    const coord = parseCoordinate(lat, lng);
    if (!coord) return;
    setQueryingNow(true);
    try {
      const ndvi = await getVegetation(coord);
      await add({
        alias,
        coordinate: coord,
        lastNdvi: ndvi.ndvi,
        lastCheckedAt: new Date().toISOString(),
      });
      navigation.goBack();
    } catch (caught) {
      const message =
        caught instanceof ApiError ? caught.detail : 'Não foi possível consultar agora.';
      setApiError(message);
    } finally {
      setQueryingNow(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bg }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={8}
            style={{ alignSelf: 'flex-start' }}
          >
            <Feather name="arrow-left" size={22} color={theme.colors.text} />
          </Pressable>

          <View>
            <Text style={[theme.typography.display, { color: theme.colors.text }]}>
              Novo favorito
            </Text>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textMuted, marginTop: theme.spacing.xs },
              ]}
            >
              Dê um apelido e coordenadas para acompanhar a área depois.
            </Text>
          </View>

          <Input
            label="Apelido"
            placeholder="Fazenda Santa Clara"
            value={alias}
            onChangeText={setAlias}
            error={aliasError}
            iconLeft={<Feather name="tag" size={18} color={theme.colors.textMuted} />}
          />

          <CoordinateInput
            lat={lat}
            lng={lng}
            onChangeLat={setLat}
            onChangeLng={setLng}
            latError={latError}
            lngError={lngError}
            disabled={submitting || queryingNow}
          />

          {preset?.ndvi !== undefined ? (
            <Card>
              <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>
                NDVI pré-carregado
              </Text>
              <Text style={[theme.typography.title, { color: theme.colors.accent }]}>
                {preset.ndvi.toFixed(3)}
              </Text>
            </Card>
          ) : null}

          {apiError ? <Alert tone="error" title="Erro" message={apiError} /> : null}

          <Button label="Salvar favorito" onPress={onSave} loading={submitting} fullWidth />
          <Button
            label="Consultar agora e salvar"
            variant="secondary"
            onPress={onQueryAndSave}
            loading={queryingNow}
            iconLeft={<Feather name="zap" size={16} color={theme.colors.text} />}
            fullWidth
          />
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
});
