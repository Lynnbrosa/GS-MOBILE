import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, Theme } from '../theme';
import { getItem, setItem } from '../storage/asyncStorage';
import { StorageKeys } from '../storage/keys';
import { ThemeMode } from '../types';

type ThemeContextValue = {
  theme: Theme;
  mode: ThemeMode;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
  hydrated: boolean;
};

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(systemScheme === 'dark' ? 'dark' : 'light');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await getItem<ThemeMode>(StorageKeys.theme);
      if (!cancelled) {
        if (stored === 'light' || stored === 'dark') {
          setModeState(stored);
        }
        setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = useCallback(async (next: ThemeMode) => {
    setModeState(next);
    await setItem(StorageKeys.theme, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setModeState((prev) => {
      const next: ThemeMode = prev === 'light' ? 'dark' : 'light';
      setItem(StorageKeys.theme, next).catch(() => undefined);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: mode === 'dark' ? darkTheme : lightTheme,
      mode,
      toggleTheme,
      setMode,
      hydrated,
    }),
    [mode, toggleTheme, setMode, hydrated],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
