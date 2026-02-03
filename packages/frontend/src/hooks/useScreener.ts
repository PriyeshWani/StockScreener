import { useState, useCallback } from 'react';
import type { Stock, ScreenerFilters } from '../types';
import { screenerApi } from '../services/api';

export function useScreener() {
  const [results, setResults] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ScreenerFilters>({});

  const runScreener = useCallback(async (newFilters?: ScreenerFilters) => {
    const activeFilters = newFilters ?? filters;
    setFilters(activeFilters);
    setLoading(true);
    setError(null);

    const response = await screenerApi.run(activeFilters);

    if (response.success && response.data) {
      setResults(response.data);
    } else {
      setError(response.error?.message ?? 'Failed to run screener');
    }

    setLoading(false);
  }, [filters]);

  const updateFilters = useCallback((newFilters: Partial<ScreenerFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  return { results, loading, error, filters, runScreener, updateFilters };
}
