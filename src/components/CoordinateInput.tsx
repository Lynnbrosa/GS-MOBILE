import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Input } from './Input';
import { useTheme } from '../hooks/useTheme';

type CoordinateInputProps = {
  lat: string;
  lng: string;
  onChangeLat: (value: string) => void;
  onChangeLng: (value: string) => void;
  latError?: string | null;
  lngError?: string | null;
  disabled?: boolean;
};

export function CoordinateInput({
  lat,
  lng,
  onChangeLat,
  onChangeLng,
  latError,
  lngError,
  disabled,
}: CoordinateInputProps) {
  const { theme } = useTheme();
  return (
    <View style={[styles.row, { gap: theme.spacing.md }]}>
      <View style={styles.field}>
        <Input
          label="Latitude"
          value={lat}
          onChangeText={onChangeLat}
          keyboardType="numbers-and-punctuation"
          placeholder="-23.5505"
          editable={!disabled}
          error={latError}
        />
      </View>
      <View style={styles.field}>
        <Input
          label="Longitude"
          value={lng}
          onChangeText={onChangeLng}
          keyboardType="numbers-and-punctuation"
          placeholder="-46.6333"
          editable={!disabled}
          error={lngError}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  field: {
    flex: 1,
  },
});
