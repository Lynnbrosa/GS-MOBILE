export type ColorScheme = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  primary: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  text: string;
  textMuted: string;
  textInverse: string;
  border: string;
  borderStrong: string;
  danger: string;
  dangerSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  overlay: string;
};

export const lightColors: ColorScheme = {
  bg: '#FAFAF7',
  surface: '#FFFFFF',
  surfaceAlt: '#F4F4EF',
  primary: '#1D4ED8',
  primarySoft: '#DBEAFE',
  accent: '#0F766E',
  accentSoft: '#CCFBF1',
  text: '#1A1A1A',
  textMuted: '#6B6B6B',
  textInverse: '#FFFFFF',
  border: '#E5E5E0',
  borderStrong: '#C7C7C0',
  danger: '#B91C1C',
  dangerSoft: '#FEE2E2',
  success: '#15803D',
  successSoft: '#DCFCE7',
  warning: '#B45309',
  warningSoft: '#FEF3C7',
  overlay: 'rgba(10, 14, 26, 0.5)',
};

export const darkColors: ColorScheme = {
  bg: '#0A0E1A',
  surface: '#131826',
  surfaceAlt: '#1A2030',
  primary: '#60A5FA',
  primarySoft: '#1E3A8A',
  accent: '#2DD4BF',
  accentSoft: '#134E4A',
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  textInverse: '#0A0E1A',
  border: '#1F2937',
  borderStrong: '#374151',
  danger: '#F87171',
  dangerSoft: '#7F1D1D',
  success: '#4ADE80',
  successSoft: '#14532D',
  warning: '#FBBF24',
  warningSoft: '#78350F',
  overlay: 'rgba(0, 0, 0, 0.7)',
};
