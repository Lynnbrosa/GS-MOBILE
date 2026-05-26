import { Coordinate } from '../types';

export function formatCoordinate(coordinate: Coordinate, precision = 4): string {
  return `${coordinate.lat.toFixed(precision)}, ${coordinate.lng.toFixed(precision)}`;
}

export function formatPercent(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits)}%`;
}

export function formatNdvi(value: number): string {
  return value.toFixed(3);
}

const relativeDivisions: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: 'seconds' },
  { amount: 60, unit: 'minutes' },
  { amount: 24, unit: 'hours' },
  { amount: 7, unit: 'days' },
  { amount: 4.34524, unit: 'weeks' },
  { amount: 12, unit: 'months' },
  { amount: Number.POSITIVE_INFINITY, unit: 'years' },
];

const relativeFormatter = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

export function formatRelativeDate(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  let duration = (date.getTime() - Date.now()) / 1000;
  for (const division of relativeDivisions) {
    if (Math.abs(duration) < division.amount) {
      return relativeFormatter.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return relativeFormatter.format(Math.round(duration), 'years');
}

const absoluteFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatAbsoluteDate(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  return absoluteFormatter.format(date);
}

export function greetByHour(hour = new Date().getHours()): string {
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function formatTemperature(value: number): string {
  return `${Math.round(value)}°C`;
}

export function formatHumidity(value: number): string {
  return `${Math.round(value)}%`;
}
