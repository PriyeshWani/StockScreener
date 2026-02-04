/**
 * Finnhub API Provider Service
 *
 * Handles all interactions with the Finnhub API including:
 * - Rate limiting (60 calls/minute on free tier)
 * - Request queuing and backoff
 * - Caching of responses
 * - Error handling and fallbacks
 */

import { config } from '../config.js';
import {
  quoteCache,
  profileCache,
  symbolsCache,
  CACHE_TTL,
  type QuoteCacheEntry,
  type ProfileCacheEntry,
  type SymbolsCacheEntry,
} from './cache.js';

// Finnhub API Response Types
interface FinnhubQuoteResponse {
  /** Current price */
  c: number;
  /** Change */
  d: number;
  /** Percent change */
  dp: number;
  /** High price of the day */
  h: number;
  /** Low price of the day */
  l: number;
  /** Open price of the day */
  o: number;
  /** Previous close price */
  pc: number;
  /** Timestamp */
  t: number;
}

interface FinnhubProfileResponse {
  /** Country of company headquarters */
  country: string;
  /** Currency used in company filings */
  currency: string;
  /** Company exchange */
  exchange: string;
  /** Company IPO date */
  ipo: string;
  /** Market capitalization */
  marketCapitalization: number;
  /** Company name */
  name: string;
  /** Company phone number */
  phone: string;
  /** Number of outstanding shares */
  shareOutstanding: number;
  /** Company ticker */
  ticker: string;
  /** Company website URL */
  weburl: string;
  /** Company logo URL */
  logo: string;
  /** Finnhub industry classification */
  finnhubIndustry: string;
}

interface FinnhubSymbolResponse {
  /** Symbol description */
  description: string;
  /** Display symbol */
  displaySymbol: string;
  /** Symbol */
  symbol: string;
  /** Security type */
  type: string;
}

interface RateLimitState {
  callsInWindow: number;
  windowStartTime: number;
}

interface QueuedRequest<T> {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  priority: number;
  addedAt: number;
}

/**
 * Finnhub API Provider with rate limiting and caching.
 */
class FinnhubProvider {
  private apiKey: string;
  private baseUrl = 'https://finnhub.io/api/v1';
  private rateLimitState: RateLimitState = {
    callsInWindow: 0,
    windowStartTime: Date.now(),
  };
  private requestQueue: Array<QueuedRequest<unknown>> = [];
  private isProcessingQueue = false;

  /** Rate limit: 60 calls per minute */
  private readonly RATE_LIMIT = 60;
  private readonly RATE_WINDOW_MS = 60 * 1000;
  /** Minimum delay between requests to spread load */
  private readonly MIN_REQUEST_DELAY_MS = 100;

  constructor() {
    this.apiKey = config.finnhubApiKey;

    if (!this.apiKey) {
      console.warn(
        '[FinnhubProvider] FINNHUB_API_KEY not set. API calls will fail.'
      );
    } else {
      console.log('[FinnhubProvider] API key configured');
    }
  }

  /**
   * Check if the API key is configured.
   */
  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  /**
   * Get the current rate limit status.
   */
  getRateLimitStatus(): {
    remaining: number;
    resetIn: number;
    isLimited: boolean;
  } {
    this.resetWindowIfNeeded();
    const remaining = this.RATE_LIMIT - this.rateLimitState.callsInWindow;
    const resetIn = Math.max(
      0,
      this.RATE_WINDOW_MS -
        (Date.now() - this.rateLimitState.windowStartTime)
    );
    return {
      remaining,
      resetIn,
      isLimited: remaining <= 0,
    };
  }

  /**
   * Reset rate limit window if it has expired.
   */
  private resetWindowIfNeeded(): void {
    const now = Date.now();
    if (now - this.rateLimitState.windowStartTime >= this.RATE_WINDOW_MS) {
      this.rateLimitState = {
        callsInWindow: 0,
        windowStartTime: now,
      };
    }
  }

  /**
   * Make a rate-limited API request.
   */
  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error('Finnhub API key not configured');
    }

    this.resetWindowIfNeeded();

    // Check if we're rate limited
    if (this.rateLimitState.callsInWindow >= this.RATE_LIMIT) {
      const waitTime =
        this.RATE_WINDOW_MS -
        (Date.now() - this.rateLimitState.windowStartTime);
      throw new Error(
        `Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds.`
      );
    }

    // Build URL with query params
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set('token', this.apiKey);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    // Increment call count before making request
    this.rateLimitState.callsInWindow++;

    try {
      const response = await fetch(url.toString());

      // Handle rate limit response from Finnhub
      if (response.status === 429) {
        // Reset our counter since we hit the actual limit
        this.rateLimitState.callsInWindow = this.RATE_LIMIT;
        throw new Error('Finnhub rate limit exceeded');
      }

      if (!response.ok) {
        throw new Error(
          `Finnhub API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      // Decrement on error to allow retry
      this.rateLimitState.callsInWindow = Math.max(
        0,
        this.rateLimitState.callsInWindow - 1
      );
      throw error;
    }
  }

  /**
   * Queue a request for rate-limited execution.
   */
  private queueRequest<T>(
    execute: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        execute: execute as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
        priority,
        addedAt: Date.now(),
      });

      // Sort by priority (higher first), then by time added
      this.requestQueue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.addedAt - b.addedAt;
      });

      this.processQueue();
    });
  }

  /**
   * Process the request queue with rate limiting.
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const { remaining, resetIn, isLimited } = this.getRateLimitStatus();

      if (isLimited) {
        // Wait until rate limit resets
        await this.sleep(resetIn + 100);
        continue;
      }

      // Add small delay between requests to spread load
      if (remaining < this.RATE_LIMIT) {
        await this.sleep(this.MIN_REQUEST_DELAY_MS);
      }

      const request = this.requestQueue.shift();
      if (!request) break;

      try {
        const result = await request.execute();
        request.resolve(result);
      } catch (error) {
        request.reject(error as Error);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Helper to sleep for a given number of milliseconds.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get a real-time quote for a symbol.
   */
  async getQuote(symbol: string): Promise<QuoteCacheEntry | null> {
    const normalizedSymbol = symbol.toUpperCase();
    const cacheKey = `quote:${normalizedSymbol}`;

    // Check cache first
    const cached = quoteCache.get(cacheKey);
    if (cached && !quoteCache.isStale(cacheKey)) {
      return cached;
    }

    try {
      const response = await this.queueRequest<FinnhubQuoteResponse>(
        () => this.makeRequest('/quote', { symbol: normalizedSymbol }),
        1 // Higher priority for quotes
      );

      // Check for invalid response (Finnhub returns zeros for invalid symbols)
      if (response.c === 0 && response.pc === 0) {
        console.warn(`[FinnhubProvider] Invalid symbol or no data: ${normalizedSymbol}`);
        return null;
      }

      const entry: QuoteCacheEntry = {
        symbol: normalizedSymbol,
        currentPrice: response.c,
        change: response.d,
        changePercent: response.dp,
        dayHigh: response.h,
        dayLow: response.l,
        open: response.o,
        previousClose: response.pc,
        timestamp: response.t * 1000, // Convert to milliseconds
      };

      // Cache the result
      quoteCache.set(cacheKey, entry, {
        ttl: CACHE_TTL.QUOTE,
        staleTtl: CACHE_TTL.QUOTE_STALE,
      });

      return entry;
    } catch (error) {
      console.error(`[FinnhubProvider] Failed to get quote for ${normalizedSymbol}:`, error);

      // Return stale data if available
      if (cached) {
        console.log(`[FinnhubProvider] Returning stale cached data for ${normalizedSymbol}`);
        return cached;
      }

      return null;
    }
  }

  /**
   * Get company profile for a symbol.
   */
  async getCompanyProfile(symbol: string): Promise<ProfileCacheEntry | null> {
    const normalizedSymbol = symbol.toUpperCase();
    const cacheKey = `profile:${normalizedSymbol}`;

    // Check cache first
    const cached = profileCache.get(cacheKey);
    if (cached && !profileCache.isStale(cacheKey)) {
      return cached;
    }

    try {
      const response = await this.queueRequest<FinnhubProfileResponse>(
        () => this.makeRequest('/stock/profile2', { symbol: normalizedSymbol }),
        0 // Lower priority for profiles (rarely changes)
      );

      // Check for empty response
      if (!response.name) {
        console.warn(`[FinnhubProvider] No profile data for: ${normalizedSymbol}`);
        return null;
      }

      const entry: ProfileCacheEntry = {
        symbol: normalizedSymbol,
        name: response.name,
        sector: this.mapFinnhubIndustryToSector(response.finnhubIndustry),
        industry: response.finnhubIndustry,
        marketCap: response.marketCapitalization * 1_000_000, // Finnhub returns in millions
        exchange: response.exchange,
        logo: response.logo || undefined,
        weburl: response.weburl || undefined,
      };

      // Cache the result
      profileCache.set(cacheKey, entry, {
        ttl: CACHE_TTL.COMPANY_PROFILE,
        staleTtl: CACHE_TTL.PROFILE_STALE,
      });

      return entry;
    } catch (error) {
      console.error(
        `[FinnhubProvider] Failed to get profile for ${normalizedSymbol}:`,
        error
      );

      // Return stale data if available
      if (cached) {
        console.log(
          `[FinnhubProvider] Returning stale cached profile for ${normalizedSymbol}`
        );
        return cached;
      }

      return null;
    }
  }

  /**
   * Get list of US stock symbols.
   * This is cached for 24 hours as the list rarely changes.
   */
  async getUSSymbols(): Promise<SymbolsCacheEntry | null> {
    const cacheKey = 'symbols:US';

    // Check cache first
    const cached = symbolsCache.get(cacheKey);
    if (cached && !symbolsCache.isStale(cacheKey)) {
      return cached;
    }

    try {
      const response = await this.queueRequest<FinnhubSymbolResponse[]>(
        () => this.makeRequest('/stock/symbol', { exchange: 'US' }),
        -1 // Lowest priority for symbols list
      );

      // Filter to common stocks only
      const commonStocks = response.filter(
        (s) => s.type === 'Common Stock' || s.type === 'EQS'
      );

      const entry: SymbolsCacheEntry = {
        symbols: commonStocks.map((s) => ({
          symbol: s.symbol,
          description: s.description,
          type: s.type,
        })),
        fetchedAt: Date.now(),
      };

      // Cache the result
      symbolsCache.set(cacheKey, entry, {
        ttl: CACHE_TTL.SYMBOLS_LIST,
        staleTtl: CACHE_TTL.SYMBOLS_LIST, // No stale tolerance for symbols
      });

      return entry;
    } catch (error) {
      console.error('[FinnhubProvider] Failed to get US symbols:', error);

      // Return stale data if available
      if (cached) {
        console.log('[FinnhubProvider] Returning stale cached symbols list');
        return cached;
      }

      return null;
    }
  }

  /**
   * Batch fetch quotes for multiple symbols.
   * Optimizes for rate limiting by spacing requests.
   */
  async getQuotes(symbols: string[]): Promise<Map<string, QuoteCacheEntry>> {
    const results = new Map<string, QuoteCacheEntry>();
    const symbolsToFetch: string[] = [];

    // First, check cache for all symbols
    for (const symbol of symbols) {
      const normalizedSymbol = symbol.toUpperCase();
      const cacheKey = `quote:${normalizedSymbol}`;
      const cached = quoteCache.get(cacheKey);

      if (cached && !quoteCache.isStale(cacheKey)) {
        results.set(normalizedSymbol, cached);
      } else {
        symbolsToFetch.push(normalizedSymbol);
      }
    }

    // Fetch remaining symbols (rate limited)
    const fetchPromises = symbolsToFetch.map(async (symbol) => {
      const quote = await this.getQuote(symbol);
      if (quote) {
        results.set(symbol, quote);
      }
    });

    await Promise.allSettled(fetchPromises);

    return results;
  }

  /**
   * Batch fetch company profiles for multiple symbols.
   */
  async getCompanyProfiles(
    symbols: string[]
  ): Promise<Map<string, ProfileCacheEntry>> {
    const results = new Map<string, ProfileCacheEntry>();
    const symbolsToFetch: string[] = [];

    // First, check cache for all symbols
    for (const symbol of symbols) {
      const normalizedSymbol = symbol.toUpperCase();
      const cacheKey = `profile:${normalizedSymbol}`;
      const cached = profileCache.get(cacheKey);

      if (cached && !profileCache.isStale(cacheKey)) {
        results.set(normalizedSymbol, cached);
      } else {
        symbolsToFetch.push(normalizedSymbol);
      }
    }

    // Fetch remaining symbols (rate limited)
    const fetchPromises = symbolsToFetch.map(async (symbol) => {
      const profile = await this.getCompanyProfile(symbol);
      if (profile) {
        results.set(symbol, profile);
      }
    });

    await Promise.allSettled(fetchPromises);

    return results;
  }

  /**
   * Map Finnhub industry classification to our sector types.
   */
  private mapFinnhubIndustryToSector(finnhubIndustry: string): string {
    const industryLower = finnhubIndustry?.toLowerCase() ?? '';

    // Technology
    if (
      industryLower.includes('software') ||
      industryLower.includes('semiconductor') ||
      industryLower.includes('technology') ||
      industryLower.includes('internet') ||
      industryLower.includes('computer') ||
      industryLower.includes('electronic')
    ) {
      return 'Technology';
    }

    // Healthcare
    if (
      industryLower.includes('health') ||
      industryLower.includes('pharma') ||
      industryLower.includes('biotech') ||
      industryLower.includes('medical')
    ) {
      return 'Healthcare';
    }

    // Finance
    if (
      industryLower.includes('bank') ||
      industryLower.includes('financial') ||
      industryLower.includes('insurance') ||
      industryLower.includes('asset management') ||
      industryLower.includes('credit')
    ) {
      return 'Finance';
    }

    // Consumer Cyclical
    if (
      industryLower.includes('retail') ||
      industryLower.includes('auto') ||
      industryLower.includes('restaurant') ||
      industryLower.includes('hotel') ||
      industryLower.includes('leisure')
    ) {
      return 'Consumer Cyclical';
    }

    // Consumer Defensive
    if (
      industryLower.includes('food') ||
      industryLower.includes('beverage') ||
      industryLower.includes('household') ||
      industryLower.includes('tobacco') ||
      industryLower.includes('grocery')
    ) {
      return 'Consumer Defensive';
    }

    // Energy
    if (
      industryLower.includes('oil') ||
      industryLower.includes('gas') ||
      industryLower.includes('energy') ||
      industryLower.includes('petroleum')
    ) {
      return 'Energy';
    }

    // Industrials
    if (
      industryLower.includes('industrial') ||
      industryLower.includes('aerospace') ||
      industryLower.includes('defense') ||
      industryLower.includes('machinery') ||
      industryLower.includes('construction')
    ) {
      return 'Industrials';
    }

    // Basic Materials
    if (
      industryLower.includes('chemical') ||
      industryLower.includes('mining') ||
      industryLower.includes('steel') ||
      industryLower.includes('metal')
    ) {
      return 'Basic Materials';
    }

    // Real Estate
    if (industryLower.includes('real estate') || industryLower.includes('reit')) {
      return 'Real Estate';
    }

    // Utilities
    if (
      industryLower.includes('utilities') ||
      industryLower.includes('electric') ||
      industryLower.includes('water')
    ) {
      return 'Utilities';
    }

    // Communication Services
    if (
      industryLower.includes('media') ||
      industryLower.includes('telecom') ||
      industryLower.includes('entertainment') ||
      industryLower.includes('communication')
    ) {
      return 'Communication Services';
    }

    // Default
    return 'Technology';
  }

  /**
   * Prefetch data for common/popular symbols.
   * Call this on startup to warm the cache.
   */
  async prefetchCommonSymbols(symbols: string[]): Promise<void> {
    console.log(
      `[FinnhubProvider] Prefetching data for ${symbols.length} symbols...`
    );

    // Fetch profiles first (less frequently needed, lower priority)
    await this.getCompanyProfiles(symbols);

    // Then fetch quotes (more frequently needed)
    await this.getQuotes(symbols);

    console.log('[FinnhubProvider] Prefetch complete');
  }
}

// Export singleton instance
export const finnhubProvider = new FinnhubProvider();

// Export types for external use
export type { QuoteCacheEntry, ProfileCacheEntry, SymbolsCacheEntry };
