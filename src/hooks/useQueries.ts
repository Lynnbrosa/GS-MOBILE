import { useCallback, useEffect, useRef, useState } from 'react';
import { PaginatedQueries, QueryFilters, SatelliteQuery } from '../types';
import { ApiError } from '../services/api';
import { getQueries } from '../services/satellite';

type UseQueriesState = {
  items: SatelliteQuery[];
  page: number;
  total: number;
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: ApiError | null;
  hasMore: boolean;
  filters: QueryFilters;
  setFilters: (next: QueryFilters) => void;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
};

const PAGE_SIZE = 10;

export function useQueries(initialFilters: QueryFilters = {}): UseQueriesState {
  const [items, setItems] = useState<SatelliteQuery[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [filters, setFiltersState] = useState<QueryFilters>(initialFilters);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const fetchPage = useCallback(
    async (pageToFetch: number, appliedFilters: QueryFilters): Promise<PaginatedQueries | null> => {
      try {
        const data = await getQueries(pageToFetch, PAGE_SIZE, appliedFilters);
        return data;
      } catch (caught) {
        if (mounted.current) {
          setError(
            caught instanceof ApiError
              ? caught
              : new ApiError({
                  type: 'about:blank',
                  title: 'Erro',
                  status: 0,
                  detail: caught instanceof Error ? caught.message : 'Falha desconhecida.',
                }),
          );
        }
        return null;
      }
    },
    [],
  );

  const refetch = useCallback(async () => {
    setError(null);
    if (items.length === 0) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    const data = await fetchPage(1, filters);
    if (data && mounted.current) {
      setItems(data.items);
      setTotal(data.total);
      setPage(1);
    }
    if (mounted.current) {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchPage, filters, items.length]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || items.length >= total) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const data = await fetchPage(nextPage, filters);
    if (data && mounted.current) {
      setItems((prev) => [...prev, ...data.items]);
      setPage(nextPage);
      setTotal(data.total);
    }
    if (mounted.current) {
      setLoadingMore(false);
    }
  }, [fetchPage, filters, items.length, loading, loadingMore, page, total]);

  const setFilters = useCallback((next: QueryFilters) => {
    setFiltersState(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      setLoading(true);
      const data = await fetchPage(1, filters);
      if (!cancelled && data && mounted.current) {
        setItems(data.items);
        setTotal(data.total);
        setPage(1);
      }
      if (!cancelled && mounted.current) {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filters, fetchPage]);

  return {
    items,
    page,
    total,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore: items.length < total,
    filters,
    setFilters,
    refetch,
    loadMore,
  };
}
