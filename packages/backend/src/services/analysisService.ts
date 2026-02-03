import type { TrendAnalysis, ScreenerFilters, ScreenerResult, PaginatedResponse } from '../types/index.js';
import { getAnalysis, getAllAnalysis, refreshAnalysis } from '../data/mockAnalysis.js';
import { mockStocks } from '../data/mockStocks.js';

export class AnalysisService {
  /**
   * Get trend analysis for a specific stock
   */
  getAnalysis(symbol: string): TrendAnalysis | null {
    return getAnalysis(symbol);
  }

  /**
   * Refresh analysis for a specific stock
   */
  refreshAnalysis(symbol: string): TrendAnalysis | null {
    return refreshAnalysis(symbol);
  }

  /**
   * Run screener with filters
   */
  runScreener(filters: ScreenerFilters): PaginatedResponse<ScreenerResult> {
    // Get all stocks with their analysis
    const allAnalysis = getAllAnalysis();

    // Combine stock data with analysis
    let results: ScreenerResult[] = allAnalysis.map(analysis => {
      const stock = mockStocks.find(s => s.symbol === analysis.symbol);
      if (!stock) return null;

      return {
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        change: stock.change,
        changePercent: stock.changePercent,
        volume: stock.volume,
        marketCap: stock.marketCap,
        sector: stock.sector as string,
        trend: analysis.direction,
        momentum: analysis.momentum,
        momentumScore: analysis.momentumScore,
        sentimentScore: analysis.sentiment.overall,
        rsi: analysis.technical.rsi,
        signals: analysis.signals,
      } as ScreenerResult;
    }).filter((r): r is ScreenerResult => r !== null);

    // Apply filters
    results = this.applyScreenerFilters(results, filters, allAnalysis);

    // Apply sorting
    results = this.applySorting(results, filters.sortBy, filters.sortOrder);

    // Get total before pagination
    const total = results.length;

    // Apply pagination
    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;
    const paginatedResults = results.slice(offset, offset + limit);

    return {
      data: paginatedResults,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Apply screener-specific filters
   */
  private applyScreenerFilters(
    results: ScreenerResult[],
    filters: ScreenerFilters,
    allAnalysis: TrendAnalysis[]
  ): ScreenerResult[] {
    return results.filter(result => {
      // Sector filter
      if (filters.sector && result.sector !== filters.sector) {
        return false;
      }
      if (filters.sectors && filters.sectors.length > 0) {
        if (!filters.sectors.includes(result.sector)) {
          return false;
        }
      }

      // Market cap filter
      if (filters.marketCap || (filters.marketCaps && filters.marketCaps.length > 0)) {
        const stock = mockStocks.find(s => s.symbol === result.symbol);
        if (stock) {
          if (filters.marketCap && stock.marketCapCategory !== filters.marketCap) {
            return false;
          }
          if (filters.marketCaps && filters.marketCaps.length > 0) {
            if (!filters.marketCaps.includes(stock.marketCapCategory)) {
              return false;
            }
          }
        }
      }

      // Price range filter
      if (filters.minPrice !== undefined && result.price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice !== undefined && result.price > filters.maxPrice) {
        return false;
      }

      // Change percentage filter
      if (filters.minChange !== undefined && result.changePercent < filters.minChange) {
        return false;
      }
      if (filters.maxChange !== undefined && result.changePercent > filters.maxChange) {
        return false;
      }

      // Volume filter
      if (filters.minVolume !== undefined && result.volume < filters.minVolume) {
        return false;
      }

      // Momentum filter
      if (filters.momentum && result.momentum !== filters.momentum) {
        return false;
      }

      // Trend filter
      if (filters.trend && result.trend !== filters.trend) {
        return false;
      }

      // Sentiment range filter
      if (filters.minSentiment !== undefined && result.sentimentScore < filters.minSentiment) {
        return false;
      }
      if (filters.maxSentiment !== undefined && result.sentimentScore > filters.maxSentiment) {
        return false;
      }

      // RSI range filter
      if (filters.minRsi !== undefined && result.rsi < filters.minRsi) {
        return false;
      }
      if (filters.maxRsi !== undefined && result.rsi > filters.maxRsi) {
        return false;
      }

      // Moving average filters
      const analysis = allAnalysis.find(a => a.symbol === result.symbol);
      if (analysis) {
        if (filters.aboveSma20 === true && result.price <= analysis.technical.sma20) {
          return false;
        }
        if (filters.aboveSma50 === true && result.price <= analysis.technical.sma50) {
          return false;
        }
        if (filters.aboveSma200 === true && result.price <= analysis.technical.sma200) {
          return false;
        }

        // Golden cross: SMA50 > SMA200
        if (filters.goldenCross === true) {
          if (analysis.technical.sma50 <= analysis.technical.sma200) {
            return false;
          }
        }

        // Death cross: SMA50 < SMA200
        if (filters.deathCross === true) {
          if (analysis.technical.sma50 >= analysis.technical.sma200) {
            return false;
          }
        }
      }

      return true;
    });
  }

  /**
   * Apply sorting to screener results
   */
  private applySorting(
    results: ScreenerResult[],
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'desc'
  ): ScreenerResult[] {
    if (!sortBy) {
      // Default sort by momentum score descending
      return results.sort((a, b) => b.momentumScore - a.momentumScore);
    }

    const multiplier = sortOrder === 'asc' ? 1 : -1;

    return results.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return (a.price - b.price) * multiplier;
        case 'change':
        case 'changePercent':
          return (a.changePercent - b.changePercent) * multiplier;
        case 'volume':
          return (a.volume - b.volume) * multiplier;
        case 'marketCap':
          return (a.marketCap - b.marketCap) * multiplier;
        case 'momentum':
        case 'momentumScore':
          return (a.momentumScore - b.momentumScore) * multiplier;
        case 'sentiment':
        case 'sentimentScore':
          return (a.sentimentScore - b.sentimentScore) * multiplier;
        case 'rsi':
          return (a.rsi - b.rsi) * multiplier;
        case 'symbol':
          return a.symbol.localeCompare(b.symbol) * multiplier;
        case 'name':
          return a.name.localeCompare(b.name) * multiplier;
        default:
          return 0;
      }
    });
  }
}

export const analysisService = new AnalysisService();
