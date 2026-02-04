/**
 * Yahoo Finance Provider Service
 *
 * Provides free, unlimited stock data including:
 * - Real-time quotes (price, change, volume)
 * - Company info (name, sector, market cap)
 * - Historical data
 *
 * No API key required, no strict rate limits.
 */

import YahooFinanceLib from 'yahoo-finance2';

// Create Yahoo Finance instance (required for v3+)
const yahooFinance = new YahooFinanceLib({ suppressNotices: ['yahooSurvey'] });

export interface YahooQuote {
  symbol: string;
  shortName: string;
  longName?: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketOpen: number;
  regularMarketPreviousClose: number;
  marketCap?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  averageDailyVolume3Month?: number;
  trailingPE?: number;
  forwardPE?: number;
  epsTrailingTwelveMonths?: number;
  dividendYield?: number;
  sector?: string;
  industry?: string;
  exchange?: string;
}

// Popular US stocks to track - can be much larger with Yahoo Finance
const DEFAULT_SYMBOLS = [
  // Mega-cap tech (Magnificent 7)
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA',
  // More tech
  'AMD', 'INTC', 'QCOM', 'AVGO', 'TXN', 'MU',
  // Software/Cloud
  'CRM', 'ADBE', 'ORCL', 'NOW', 'SNOW', 'PLTR',
  // Internet/Media
  'NFLX', 'DIS', 'CMCSA', 'PARA', 'WBD',
  // Finance - Banks
  'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS',
  // Finance - Payments
  'V', 'MA', 'PYPL', 'SQ',
  // Healthcare - Pharma
  'JNJ', 'PFE', 'MRK', 'ABBV', 'LLY', 'BMY',
  // Healthcare - Insurance
  'UNH', 'CVS', 'CI', 'HUM',
  // Consumer - Retail
  'WMT', 'COST', 'TGT', 'HD', 'LOW',
  // Consumer - Food/Beverage
  'KO', 'PEP', 'MCD', 'SBUX',
  // Consumer - Other
  'NKE', 'LULU',
  // Energy
  'XOM', 'CVX', 'COP', 'SLB', 'EOG',
  // Industrial
  'CAT', 'BA', 'UPS', 'FDX', 'HON', 'GE', 'MMM',
  // Automotive
  'F', 'GM', 'RIVN', 'LCID',
  // Airlines
  'DAL', 'UAL', 'LUV', 'AAL',
  // Real Estate
  'AMT', 'PLD', 'SPG',
  // Utilities
  'NEE', 'DUK', 'SO',
  // Telecom
  'T', 'VZ', 'TMUS',
  // Materials
  'LIN', 'APD', 'FCX', 'NEM',
  // Popular growth/meme stocks
  'COIN', 'HOOD', 'RBLX', 'U', 'DKNG', 'ABNB', 'UBER', 'LYFT',
];

class YahooFinanceProvider {
  private quoteCache: Map<string, { data: YahooQuote; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30 * 1000; // 30 seconds

  /**
   * Get list of default symbols to track.
   */
  getDefaultSymbols(): string[] {
    return [...DEFAULT_SYMBOLS];
  }

  /**
   * Get quote for a single symbol.
   */
  async getQuote(symbol: string): Promise<YahooQuote | null> {
    const cached = this.quoteCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const result = await yahooFinance.quote(symbol) as Record<string, unknown>;

      if (!result || !result.regularMarketPrice) {
        console.warn(`[YahooFinance] No data for symbol: ${symbol}`);
        return null;
      }

      const quote = this.mapToYahooQuote(result);
      this.quoteCache.set(symbol, { data: quote, timestamp: Date.now() });
      return quote;
    } catch (error) {
      console.error(`[YahooFinance] Error fetching quote for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Map raw Yahoo Finance result to our YahooQuote interface.
   */
  private mapToYahooQuote(result: Record<string, unknown>): YahooQuote {
    const price = (result.regularMarketPrice as number) ?? 0;

    return {
      symbol: (result.symbol as string) ?? '',
      shortName: (result.shortName as string) ?? (result.symbol as string) ?? '',
      longName: result.longName as string | undefined,
      regularMarketPrice: price,
      regularMarketChange: (result.regularMarketChange as number) ?? 0,
      regularMarketChangePercent: (result.regularMarketChangePercent as number) ?? 0,
      regularMarketVolume: (result.regularMarketVolume as number) ?? 0,
      regularMarketDayHigh: (result.regularMarketDayHigh as number) ?? price,
      regularMarketDayLow: (result.regularMarketDayLow as number) ?? price,
      regularMarketOpen: (result.regularMarketOpen as number) ?? price,
      regularMarketPreviousClose: (result.regularMarketPreviousClose as number) ?? price,
      marketCap: result.marketCap as number | undefined,
      fiftyTwoWeekHigh: result.fiftyTwoWeekHigh as number | undefined,
      fiftyTwoWeekLow: result.fiftyTwoWeekLow as number | undefined,
      averageDailyVolume3Month: result.averageDailyVolume3Month as number | undefined,
      trailingPE: result.trailingPE as number | undefined,
      forwardPE: result.forwardPE as number | undefined,
      epsTrailingTwelveMonths: result.epsTrailingTwelveMonths as number | undefined,
      dividendYield: result.dividendYield as number | undefined,
      exchange: result.exchange as string | undefined,
    };
  }

  /**
   * Get quotes for multiple symbols (batched for efficiency).
   */
  async getQuotes(symbols: string[]): Promise<Map<string, YahooQuote>> {
    const results = new Map<string, YahooQuote>();
    const symbolsToFetch: string[] = [];

    // Check cache first
    for (const symbol of symbols) {
      const cached = this.quoteCache.get(symbol);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        results.set(symbol, cached.data);
      } else {
        symbolsToFetch.push(symbol);
      }
    }

    if (symbolsToFetch.length === 0) {
      return results;
    }

    console.log(`[YahooFinance] Fetching ${symbolsToFetch.length} symbols...`);

    // Fetch in batches of 10 to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < symbolsToFetch.length; i += batchSize) {
      const batch = symbolsToFetch.slice(i, i + batchSize);

      // Fetch each symbol individually
      const batchPromises = batch.map(async (symbol) => {
        try {
          const result = await yahooFinance.quote(symbol) as Record<string, unknown>;
          if (result && result.regularMarketPrice) {
            const quote = this.mapToYahooQuote(result);
            this.quoteCache.set(symbol, { data: quote, timestamp: Date.now() });
            return { symbol, quote };
          }
          return null;
        } catch (err) {
          console.warn(`[YahooFinance] Failed to fetch ${symbol}`);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);

      for (const item of batchResults) {
        if (item) {
          results.set(item.symbol, item.quote);
        }
      }

      // Progress log
      console.log(`[YahooFinance] Fetched ${Math.min(i + batchSize, symbolsToFetch.length)}/${symbolsToFetch.length} symbols`);

      // Small delay between batches to be nice to Yahoo
      if (i + batchSize < symbolsToFetch.length) {
        await this.sleep(200);
      }
    }

    console.log(`[YahooFinance] Completed fetching ${results.size} symbols`);
    return results;
  }

  /**
   * Search for symbols by query.
   */
  async searchSymbols(query: string): Promise<Array<{ symbol: string; name: string; type: string }>> {
    try {
      const results = await yahooFinance.search(query) as Record<string, unknown>;
      const quotes = (results.quotes ?? []) as Array<Record<string, unknown>>;

      return quotes
        .filter((q) =>
          q.symbol !== undefined &&
          (q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
        )
        .map((q) => ({
          symbol: q.symbol as string,
          name: (q.shortname ?? q.longname ?? q.symbol) as string,
          type: (q.quoteType ?? 'EQUITY') as string,
        }));
    } catch (error) {
      console.error('[YahooFinance] Error searching symbols:', error);
      return [];
    }
  }

  /**
   * Map Yahoo Finance sector to our standard sectors.
   */
  mapSector(yahooSector?: string): string {
    if (!yahooSector) return 'Technology'; // Default

    const sectorMap: Record<string, string> = {
      'Technology': 'Technology',
      'Healthcare': 'Healthcare',
      'Financial Services': 'Finance',
      'Financials': 'Finance',
      'Consumer Cyclical': 'Consumer Cyclical',
      'Consumer Defensive': 'Consumer Defensive',
      'Communication Services': 'Communication Services',
      'Energy': 'Energy',
      'Industrials': 'Industrials',
      'Basic Materials': 'Basic Materials',
      'Real Estate': 'Real Estate',
      'Utilities': 'Utilities',
    };

    return sectorMap[yahooSector] ?? 'Technology';
  }

  /**
   * Helper to sleep for a given number of milliseconds.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Clear the cache.
   */
  clearCache(): void {
    this.quoteCache.clear();
  }

  /**
   * Get cache statistics.
   */
  getCacheStats(): { size: number; symbols: string[] } {
    return {
      size: this.quoteCache.size,
      symbols: Array.from(this.quoteCache.keys()),
    };
  }
}

export const yahooFinanceProvider = new YahooFinanceProvider();
