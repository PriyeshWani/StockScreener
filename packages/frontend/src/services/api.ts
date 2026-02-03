import type { Stock, TrendAnalysis, MovementPrediction, ScreenerFilters, ApiResponse, PaginatedResponse, RecommendationResponse } from '../types';

const API_BASE = '/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          message: data.error?.message ?? 'Request failed',
          code: data.error?.code ?? 'UNKNOWN_ERROR',
        },
      };
    }

    return {
      success: true,
      data: data.data ?? data,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Network error',
        code: 'NETWORK_ERROR',
      },
    };
  }
}

export const stockApi = {
  getAll: async (params?: { page?: number; limit?: number; sector?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.sector) searchParams.set('sector', params.sector);
    const query = searchParams.toString();
    const result = await fetchApi<PaginatedResponse<Stock>>(`/stocks${query ? `?${query}` : ''}`);

    // Handle both paginated and direct array responses
    if (result.success && result.data) {
      const data = result.data as PaginatedResponse<Stock> | Stock[];
      return {
        success: true,
        data: Array.isArray(data) ? data : data.data,
      } as ApiResponse<Stock[]>;
    }
    return { success: false, error: result.error } as ApiResponse<Stock[]>;
  },

  getBySymbol: (symbol: string) => {
    return fetchApi<Stock>(`/stocks/${symbol}`);
  },

  getAnalysis: (symbol: string) => {
    return fetchApi<TrendAnalysis>(`/stocks/${symbol}/analysis`);
  },
};

export const movementApi = {
  getAll: async (params?: { direction?: string; minConfidence?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.direction) searchParams.set('direction', params.direction);
    if (params?.minConfidence) searchParams.set('minConfidence', String(params.minConfidence));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    const result = await fetchApi<PaginatedResponse<MovementPrediction>>(`/movements${query ? `?${query}` : ''}`);

    // Handle both paginated and direct array responses
    if (result.success && result.data) {
      const data = result.data as PaginatedResponse<MovementPrediction> | MovementPrediction[];
      return {
        success: true,
        data: Array.isArray(data) ? data : data.data,
      } as ApiResponse<MovementPrediction[]>;
    }
    return { success: false, error: result.error } as ApiResponse<MovementPrediction[]>;
  },
};

export const screenerApi = {
  run: async (filters: ScreenerFilters) => {
    const searchParams = new URLSearchParams();
    if (filters.sectors?.length) searchParams.set('sectors', filters.sectors.join(','));
    if (filters.minMarketCap) searchParams.set('minMarketCap', String(filters.minMarketCap));
    if (filters.maxMarketCap) searchParams.set('maxMarketCap', String(filters.maxMarketCap));
    if (filters.minPrice) searchParams.set('minPrice', String(filters.minPrice));
    if (filters.maxPrice) searchParams.set('maxPrice', String(filters.maxPrice));
    if (filters.direction) searchParams.set('trend', filters.direction);
    if (filters.momentum) searchParams.set('momentum', filters.momentum);
    if (filters.sortBy) searchParams.set('sortBy', filters.sortBy);
    if (filters.sortOrder) searchParams.set('sortOrder', filters.sortOrder);
    const query = searchParams.toString();
    const result = await fetchApi<PaginatedResponse<Stock>>(`/screener${query ? `?${query}` : ''}`);

    // Handle both paginated and direct array responses
    if (result.success && result.data) {
      const data = result.data as PaginatedResponse<Stock> | Stock[];
      return {
        success: true,
        data: Array.isArray(data) ? data : data.data,
      } as ApiResponse<Stock[]>;
    }
    return { success: false, error: result.error } as ApiResponse<Stock[]>;
  },
};

export const healthApi = {
  check: () => fetchApi<{ message: string; timestamp: string }>('/health'),
};

export const recommendationApi = {
  get: async (params: {
    targetProfit: number;
    riskTolerance: number;
    exitDate: string;
    investmentAmount?: number;
  }) => {
    const searchParams = new URLSearchParams();
    searchParams.set('targetProfit', String(params.targetProfit));
    searchParams.set('riskTolerance', String(params.riskTolerance));
    searchParams.set('exitDate', params.exitDate);
    if (params.investmentAmount) {
      searchParams.set('investmentAmount', String(params.investmentAmount));
    }
    return fetchApi<RecommendationResponse>(`/recommendations?${searchParams.toString()}`);
  },
};
