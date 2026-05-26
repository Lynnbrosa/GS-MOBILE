import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../services/api';

type UseApiOptions = {
  immediate?: boolean;
};

export type UseApiState<T> = {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
  setData: (data: T | null) => void;
};

export function useApi<T>(fn: () => Promise<T>, options: UseApiOptions = {}): UseApiState<T> {
  const { immediate = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<ApiError | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fnRef.current();
      if (mounted.current) {
        setData(result);
      }
    } catch (caught) {
      if (mounted.current) {
        setError(caught instanceof ApiError ? caught : new ApiError({
          type: 'about:blank',
          title: 'Erro inesperado',
          status: 0,
          detail: caught instanceof Error ? caught.message : 'Falha desconhecida.',
        }));
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (immediate) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, error, refetch, setData };
}
