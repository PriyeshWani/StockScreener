import { useState, useEffect, useCallback } from 'react';
import type { MovementPrediction } from '../types';
import { movementApi } from '../services/api';

export function useMovements(direction?: 'up' | 'down', minConfidence?: number) {
  const [movements, setMovements] = useState<MovementPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await movementApi.getAll({
      direction,
      minConfidence,
      limit: 20,
    });

    if (response.success && response.data) {
      setMovements(response.data);
    } else {
      setError(response.error?.message ?? 'Failed to fetch movements');
    }

    setLoading(false);
  }, [direction, minConfidence]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  return { movements, loading, error, refetch: fetchMovements };
}
