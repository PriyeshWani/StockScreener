import { useState, useEffect, useCallback } from 'react';
import type { Stock, TrendAnalysis } from '../types';
import { stockApi } from '../services/api';

export function useStocks(sector?: string) {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStocks = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await stockApi.getAll({ sector, limit: 50 });

    if (response.success && response.data) {
      setStocks(response.data);
    } else {
      setError(response.error?.message ?? 'Failed to fetch stocks');
    }

    setLoading(false);
  }, [sector]);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  return { stocks, loading, error, refetch: fetchStocks };
}

export function useStockAnalysis(symbol: string | null) {
  const [analysis, setAnalysis] = useState<TrendAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) {
      setAnalysis(null);
      return;
    }

    setLoading(true);
    setError(null);

    stockApi.getAnalysis(symbol).then(response => {
      if (response.success && response.data) {
        setAnalysis(response.data);
      } else {
        setError(response.error?.message ?? 'Failed to fetch analysis');
      }
      setLoading(false);
    });
  }, [symbol]);

  return { analysis, loading, error };
}
