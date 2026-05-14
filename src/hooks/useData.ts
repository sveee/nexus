import { useState, useCallback, useRef } from 'react';
import type { ApiResult } from '../types';

export interface DataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  fetchedAt: number | null;
  isStale: boolean;
}

export function useData<T>(
  fetcher: (refresh?: boolean) => Promise<ApiResult<T>>
) {
  const [state, setState] = useState<DataState<T>>({
    data: null,
    loading: false,
    error: null,
    fetchedAt: null,
    isStale: false,
  });

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refetch = useCallback(async (refresh = false) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const result = await fetcherRef.current(refresh);
      setState({
        data: result.data,
        loading: false,
        error: null,
        fetchedAt: result.fetchedAt,
        isStale: result.isStale,
      });
    } catch (err) {
      setState(s => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load data',
      }));
    }
  }, []);

  return { ...state, refetch };
}
