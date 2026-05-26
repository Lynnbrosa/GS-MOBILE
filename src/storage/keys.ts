export const StorageKeys = {
  token: '@orbittapi:token',
  account: '@orbittapi:account',
  theme: '@orbittapi:theme',
  favorites: '@orbittapi:favorites',
  notifications: '@orbittapi:notifications',
  queries: '@orbittapi:queries',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];
