import { ColorScheme, darkColors, lightColors } from './colors';
import { radius, spacing } from './spacing';
import { typography } from './typography';
import { ThemeMode } from '../types';

export type Theme = {
  mode: ThemeMode;
  colors: ColorScheme;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
};

export const lightTheme: Theme = {
  mode: 'light',
  colors: lightColors,
  spacing,
  radius,
  typography,
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: darkColors,
  spacing,
  radius,
  typography,
};

export { lightColors, darkColors, spacing, radius, typography };
export type { ColorScheme };
