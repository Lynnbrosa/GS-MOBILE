import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Coordinate, Favorite } from '../types';
import { getItem, setItem } from '../storage/asyncStorage';
import { StorageKeys } from '../storage/keys';

type FavoriteInput = {
  alias: string;
  coordinate: Coordinate;
  lastNdvi?: number;
  lastCheckedAt?: string;
};

type FavoritesContextValue = {
  favorites: Favorite[];
  loading: boolean;
  add: (favorite: FavoriteInput) => Promise<Favorite>;
  update: (id: string, patch: Partial<FavoriteInput>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
};

export const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

type FavoritesProviderProps = {
  children: ReactNode;
};

function newId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `fav-${Date.now()}-${random}`;
}

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await getItem<Favorite[]>(StorageKeys.favorites);
      if (!cancelled) {
        setFavorites(stored ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next: Favorite[]) => {
    setFavorites(next);
    await setItem(StorageKeys.favorites, next);
  }, []);

  const add = useCallback(
    async (input: FavoriteInput): Promise<Favorite> => {
      const created: Favorite = {
        id: newId(),
        alias: input.alias.trim(),
        coordinate: input.coordinate,
        lastNdvi: input.lastNdvi,
        lastCheckedAt: input.lastCheckedAt,
      };
      const next = [created, ...favorites];
      await persist(next);
      return created;
    },
    [favorites, persist],
  );

  const update = useCallback(
    async (id: string, patch: Partial<FavoriteInput>) => {
      const next = favorites.map((favorite) =>
        favorite.id === id
          ? {
              ...favorite,
              ...patch,
              alias: patch.alias?.trim() ?? favorite.alias,
            }
          : favorite,
      );
      await persist(next);
    },
    [favorites, persist],
  );

  const remove = useCallback(
    async (id: string) => {
      const next = favorites.filter((favorite) => favorite.id !== id);
      await persist(next);
    },
    [favorites, persist],
  );

  const clear = useCallback(async () => {
    await persist([]);
  }, [persist]);

  const value = useMemo<FavoritesContextValue>(
    () => ({ favorites, loading, add, update, remove, clear }),
    [favorites, loading, add, update, remove, clear],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}
