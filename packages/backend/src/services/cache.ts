/**
 * In-memory cache with TTL support for the Stock Screener application.
 * Designed for caching Finnhub API responses to minimize rate limit usage.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  staleAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  staleHits: number;
  size: number;
}

interface CacheOptions {
  /** Time-to-live in milliseconds */
  ttl: number;
  /** Stale time in milliseconds (for stale-while-revalidate pattern) */
  staleTtl?: number;
}

/**
 * Generic in-memory cache with TTL and stale-while-revalidate support.
 */
export class MemoryCache<T = unknown> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    staleHits: 0,
    size: 0,
  };
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private cleanupIntervalMs: number = 60000) {
    // Start periodic cleanup of expired entries
    this.startCleanup();
  }

  /**
   * Get a value from the cache.
   * Returns undefined if not found or expired (unless within stale window).
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    const now = Date.now();

    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    // Check if completely expired (past stale time)
    if (now > entry.staleAt) {
      this.cache.delete(key);
      this.stats.size--;
      this.stats.misses++;
      return undefined;
    }

    // Check if stale but still usable
    if (now > entry.expiresAt) {
      this.stats.staleHits++;
      return entry.value;
    }

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Check if the cached value is stale (but still usable for stale-while-revalidate).
   */
  isStale(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;
    return Date.now() > entry.expiresAt;
  }

  /**
   * Set a value in the cache with TTL.
   */
  set(key: string, value: T, options: CacheOptions): void {
    const now = Date.now();
    const expiresAt = now + options.ttl;
    const staleAt = expiresAt + (options.staleTtl ?? options.ttl);

    const isNew = !this.cache.has(key);
    this.cache.set(key, { value, expiresAt, staleAt });

    if (isNew) {
      this.stats.size++;
    }
  }

  /**
   * Check if key exists and is not expired.
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    return Date.now() <= entry.staleAt;
  }

  /**
   * Delete a key from the cache.
   */
  delete(key: string): boolean {
    const existed = this.cache.has(key);
    if (existed) {
      this.cache.delete(key);
      this.stats.size--;
    }
    return existed;
  }

  /**
   * Clear all entries from the cache.
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  /**
   * Get cache statistics.
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics counters.
   */
  resetStats(): void {
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.staleHits = 0;
  }

  /**
   * Get all keys in the cache.
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get multiple values at once.
   */
  getMany(keys: string[]): Map<string, T> {
    const result = new Map<string, T>();
    for (const key of keys) {
      const value = this.get(key);
      if (value !== undefined) {
        result.set(key, value);
      }
    }
    return result;
  }

  /**
   * Set multiple values at once.
   */
  setMany(entries: Array<{ key: string; value: T }>, options: CacheOptions): void {
    for (const { key, value } of entries) {
      this.set(key, value, options);
    }
  }

  /**
   * Start periodic cleanup of expired entries.
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.cleanupIntervalMs);
  }

  /**
   * Remove all expired entries.
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now > entry.staleAt) {
        keysToDelete.push(key);
      }
    });

    for (const key of keysToDelete) {
      this.cache.delete(key);
      removed++;
    }

    if (removed > 0) {
      this.stats.size -= removed;
    }
  }

  /**
   * Stop the cache and cleanup interval.
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  /** Stock quotes - 30 seconds (real-time data, frequent updates) */
  QUOTE: 30 * 1000,
  /** Company profiles - 24 hours (rarely changes) */
  COMPANY_PROFILE: 24 * 60 * 60 * 1000,
  /** Market status - 5 minutes */
  MARKET_STATUS: 5 * 60 * 1000,
  /** US symbols list - 24 hours (rarely changes) */
  SYMBOLS_LIST: 24 * 60 * 60 * 1000,
  /** Stale tolerance for quotes - additional 30 seconds */
  QUOTE_STALE: 30 * 1000,
  /** Stale tolerance for profiles - additional 1 hour */
  PROFILE_STALE: 60 * 60 * 1000,
} as const;

// Pre-configured cache instances for different data types
export const quoteCache = new MemoryCache<QuoteCacheEntry>(60000);
export const profileCache = new MemoryCache<ProfileCacheEntry>(300000);
export const symbolsCache = new MemoryCache<SymbolsCacheEntry>(3600000);

// Type definitions for cached data
export interface QuoteCacheEntry {
  symbol: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  open: number;
  previousClose: number;
  timestamp: number;
}

export interface ProfileCacheEntry {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  marketCap: number;
  exchange: string;
  logo?: string;
  weburl?: string;
}

export interface SymbolsCacheEntry {
  symbols: Array<{
    symbol: string;
    description: string;
    type: string;
  }>;
  fetchedAt: number;
}
