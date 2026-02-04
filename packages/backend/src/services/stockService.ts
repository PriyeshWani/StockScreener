import type {
  Stock,
  StockSummary,
  StockFilters,
  PaginatedResponse,
  Sector,
  MarketCapCategory,
} from '../types/index.js';
import { config as appConfig } from '../config.js';
import { mockStocks, getStockBySymbol } from '../data/mockStocks.js';
import {
  finnhubProvider,
  type QuoteCacheEntry,
  type ProfileCacheEntry,
} from './finnhubProvider.js';

/**
 * Configuration for the stock service data source.
 */
interface StockServiceConfig {
  /** Use real API data instead of mock data */
  useRealData: boolean;
  /** List of symbols to track (when using real data) */
  trackedSymbols: string[];
}

/**
 * Get the list of default tracked symbols.
 * Limited to 10 symbols for free tier rate limits (60 calls/min).
 * Each symbol needs ~2 calls (quote + profile), so 10 symbols = ~20 calls.
 */
function getDefaultTrackedSymbols(): string[] {
  return [
    // Top tech stocks (diverse sectors)
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA',
    // Finance & Healthcare
    'JPM', 'JNJ',
    // Consumer & Energy
    'WMT', 'XOM', 'DIS',
  ];
}

/**
 * Determine market cap category from market cap value.
 */
function getMarketCapCategory(marketCap: number): MarketCapCategory {
  if (marketCap >= 200_000_000_000) return 'mega';
  if (marketCap >= 10_000_000_000) return 'large';
  if (marketCap >= 2_000_000_000) return 'mid';
  return 'small';
}

/**
 * Map a sector string to a valid Sector type.
 */
function mapToSector(sector: string): Sector {
  const sectorMap: Record<string, Sector> = {
    'Technology': 'Technology',
    'Healthcare': 'Healthcare',
    'Finance': 'Finance',
    'Consumer Cyclical': 'Consumer Cyclical',
    'Consumer Defensive': 'Consumer Defensive',
    'Energy': 'Energy',
    'Industrials': 'Industrials',
    'Basic Materials': 'Basic Materials',
    'Real Estate': 'Real Estate',
    'Utilities': 'Utilities',
    'Communication Services': 'Communication Services',
  };
  return sectorMap[sector] ?? 'Technology';
}

export class StockService {
  private config: StockServiceConfig;
  private stockDataCache: Map<string, Stock> = new Map();
  private lastDataRefresh: number = 0;
  private readonly DATA_REFRESH_INTERVAL = 30 * 1000; // 30 seconds

  constructor(config?: Partial<StockServiceConfig>) {
    this.config = {
      useRealData: config?.useRealData ?? appConfig.useRealData,
      trackedSymbols: config?.trackedSymbols ?? getDefaultTrackedSymbols(),
    };

    // Log configuration
    console.log(
      `[StockService] Initialized with ${this.config.useRealData ? 'REAL' : 'MOCK'} data mode`
    );

    if (this.config.useRealData && !finnhubProvider.isConfigured()) {
      console.warn(
        '[StockService] Real data mode enabled but Finnhub API key not configured. Falling back to mock data.'
      );
      this.config.useRealData = false;
    }
  }

  /**
   * Initialize the service and prefetch data for tracked symbols.
   * Call this on server startup for better initial performance.
   */
  async initialize(): Promise<void> {
    if (!this.config.useRealData) {
      console.log('[StockService] Using mock data, skipping initialization');
      return;
    }

    console.log('[StockService] Initializing and prefetching data...');

    try {
      await this.refreshStockData();
      console.log('[StockService] Initialization complete');
    } catch (error) {
      console.error('[StockService] Initialization failed:', error);
    }
  }

  /**
   * Refresh stock data from Finnhub API.
   */
  private async refreshStockData(): Promise<void> {
    if (!this.config.useRealData) return;

    const now = Date.now();
    if (now - this.lastDataRefresh < this.DATA_REFRESH_INTERVAL) {
      return; // Skip if recently refreshed
    }

    console.log('[StockService] Refreshing stock data...');

    // Fetch quotes and profiles in parallel
    const [quotes, profiles] = await Promise.all([
      finnhubProvider.getQuotes(this.config.trackedSymbols),
      finnhubProvider.getCompanyProfiles(this.config.trackedSymbols),
    ]);

    // Combine data into Stock objects
    for (const symbol of this.config.trackedSymbols) {
      const quote = quotes.get(symbol);
      const profile = profiles.get(symbol);

      if (quote && profile) {
        const stock = this.buildStockFromApiData(quote, profile);
        this.stockDataCache.set(symbol, stock);
      } else {
        // Try to use mock data as fallback for this symbol
        const mockStock = getStockBySymbol(symbol);
        if (mockStock) {
          this.stockDataCache.set(symbol, mockStock);
        }
      }
    }

    this.lastDataRefresh = now;
    console.log(`[StockService] Refreshed data for ${this.stockDataCache.size} stocks`);
  }

  /**
   * Build a Stock object from Finnhub API data.
   */
  private buildStockFromApiData(
    quote: QuoteCacheEntry,
    profile: ProfileCacheEntry
  ): Stock {
    const marketCapCategory = getMarketCapCategory(profile.marketCap);
    const sector = mapToSector(profile.sector);

    return {
      symbol: profile.symbol,
      name: profile.name,
      price: quote.currentPrice,
      previousClose: quote.previousClose,
      change: quote.change,
      changePercent: quote.changePercent,
      volume: 0, // Finnhub quote doesn't include volume in free tier
      avgVolume: 0,
      marketCap: profile.marketCap,
      marketCapCategory,
      sector,
      industry: profile.industry,
      exchange: profile.exchange,
      high52Week: 0, // Not available in basic quote
      low52Week: 0,
      dayHigh: quote.dayHigh,
      dayLow: quote.dayLow,
      open: quote.open,
      lastUpdated: new Date(quote.timestamp).toISOString(),
    };
  }

  /**
   * Get paginated list of stocks with optional filtering.
   */
  async getStocks(filters: StockFilters): Promise<PaginatedResponse<StockSummary>> {
    let stocks: Stock[];

    if (this.config.useRealData) {
      // Ensure data is fresh
      await this.refreshStockData();
      stocks = Array.from(this.stockDataCache.values());

      // If we have no cached data, fall back to mock
      if (stocks.length === 0) {
        console.warn('[StockService] No real data available, falling back to mock');
        stocks = [...mockStocks];
      }
    } else {
      stocks = [...mockStocks];
    }

    // Apply filters
    stocks = this.applyFilters(stocks, filters);

    // Apply sorting
    stocks = this.applySorting(stocks, filters.sortBy, filters.sortOrder);

    // Get total count before pagination
    const total = stocks.length;

    // Apply pagination
    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;
    const paginatedStocks = stocks.slice(offset, offset + limit);

    // Map to summary format
    const summaries: StockSummary[] = paginatedStocks.map((stock) => ({
      symbol: stock.symbol,
      name: stock.name,
      price: stock.price,
      change: stock.change,
      changePercent: stock.changePercent,
      volume: stock.volume,
      marketCap: stock.marketCap,
      marketCapCategory: stock.marketCapCategory,
      sector: stock.sector,
    }));

    return {
      data: summaries,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get detailed stock information by symbol.
   */
  async getStock(symbol: string): Promise<Stock | null> {
    const normalizedSymbol = symbol.toUpperCase();

    if (this.config.useRealData) {
      // Check cache first
      if (this.stockDataCache.has(normalizedSymbol)) {
        return this.stockDataCache.get(normalizedSymbol) ?? null;
      }

      // Fetch from API if not in cache
      const [quote, profile] = await Promise.all([
        finnhubProvider.getQuote(normalizedSymbol),
        finnhubProvider.getCompanyProfile(normalizedSymbol),
      ]);

      if (quote && profile) {
        const stock = this.buildStockFromApiData(quote, profile);
        this.stockDataCache.set(normalizedSymbol, stock);
        return stock;
      }
    }

    // Fall back to mock data
    return getStockBySymbol(normalizedSymbol) ?? null;
  }

  /**
   * Get all unique sectors.
   */
  getSectors(): string[] {
    if (this.config.useRealData && this.stockDataCache.size > 0) {
      const sectors = new Set(
        Array.from(this.stockDataCache.values()).map((s) => s.sector)
      );
      return Array.from(sectors).sort();
    }

    const sectors = new Set(mockStocks.map((s) => s.sector));
    return Array.from(sectors).sort();
  }

  /**
   * Get all unique exchanges.
   */
  getExchanges(): string[] {
    if (this.config.useRealData && this.stockDataCache.size > 0) {
      const exchanges = new Set(
        Array.from(this.stockDataCache.values()).map((s) => s.exchange)
      );
      return Array.from(exchanges).sort();
    }

    const exchanges = new Set(mockStocks.map((s) => s.exchange));
    return Array.from(exchanges).sort();
  }

  /**
   * Get rate limit status from the Finnhub provider.
   */
  getRateLimitStatus(): { remaining: number; resetIn: number; isLimited: boolean } {
    return finnhubProvider.getRateLimitStatus();
  }

  /**
   * Check if the service is using real data.
   */
  isUsingRealData(): boolean {
    return this.config.useRealData;
  }

  /**
   * Get the list of tracked symbols.
   */
  getTrackedSymbols(): string[] {
    return [...this.config.trackedSymbols];
  }

  /**
   * Add a symbol to the tracked list.
   */
  addTrackedSymbol(symbol: string): void {
    const normalizedSymbol = symbol.toUpperCase();
    if (!this.config.trackedSymbols.includes(normalizedSymbol)) {
      this.config.trackedSymbols.push(normalizedSymbol);
    }
  }

  /**
   * Apply filters to stock list.
   */
  private applyFilters(stocks: Stock[], filters: StockFilters): Stock[] {
    return stocks.filter((stock) => {
      // Sector filter
      if (filters.sector && stock.sector !== filters.sector) {
        return false;
      }
      if (filters.sectors && filters.sectors.length > 0) {
        if (!filters.sectors.includes(stock.sector)) {
          return false;
        }
      }

      // Market cap filter
      if (filters.marketCap && stock.marketCapCategory !== filters.marketCap) {
        return false;
      }
      if (filters.marketCaps && filters.marketCaps.length > 0) {
        if (!filters.marketCaps.includes(stock.marketCapCategory)) {
          return false;
        }
      }

      // Price range filter
      if (filters.minPrice !== undefined && stock.price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice !== undefined && stock.price > filters.maxPrice) {
        return false;
      }

      // Change percentage filter
      if (
        filters.minChange !== undefined &&
        stock.changePercent < filters.minChange
      ) {
        return false;
      }
      if (
        filters.maxChange !== undefined &&
        stock.changePercent > filters.maxChange
      ) {
        return false;
      }

      // Volume filter
      if (filters.minVolume !== undefined && stock.volume < filters.minVolume) {
        return false;
      }
      if (filters.maxVolume !== undefined && stock.volume > filters.maxVolume) {
        return false;
      }

      // Exchange filter
      if (filters.exchange && stock.exchange !== filters.exchange) {
        return false;
      }

      // Search filter (symbol or name)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSymbol = stock.symbol.toLowerCase().includes(searchLower);
        const matchesName = stock.name.toLowerCase().includes(searchLower);
        if (!matchesSymbol && !matchesName) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Apply sorting to stock list.
   */
  private applySorting(
    stocks: Stock[],
    sortBy?: StockFilters['sortBy'],
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Stock[] {
    if (!sortBy) {
      // Default sort by market cap descending
      return stocks.sort((a, b) => b.marketCap - a.marketCap);
    }

    const multiplier = sortOrder === 'asc' ? 1 : -1;

    return stocks.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return (a.price - b.price) * multiplier;
        case 'change':
          return (a.change - b.change) * multiplier;
        case 'changePercent':
          return (a.changePercent - b.changePercent) * multiplier;
        case 'volume':
          return (a.volume - b.volume) * multiplier;
        case 'marketCap':
          return (a.marketCap - b.marketCap) * multiplier;
        case 'name':
          return a.name.localeCompare(b.name) * multiplier;
        case 'symbol':
          return a.symbol.localeCompare(b.symbol) * multiplier;
        default:
          return 0;
      }
    });
  }
}

export const stockService = new StockService();
