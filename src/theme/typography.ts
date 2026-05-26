import { TextStyle } from 'react-native';

export const typography = {
  display: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  bodyStrong: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  micro: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
  },
} as const satisfies Record<string, TextStyle>;

export type Typography = typeof typography;
