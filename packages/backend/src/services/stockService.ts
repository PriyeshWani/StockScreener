import type { Stock, StockSummary, StockFilters, PaginatedResponse } from '../types/index.js';
import { mockStocks, getStockBySymbol } from '../data/mockStocks.js';

export class StockService {
  /**
   * Get paginated list of stocks with optional filtering
   */
  getStocks(filters: StockFilters): PaginatedResponse<StockSummary> {
    let stocks = [...mockStocks];

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
    const summaries: StockSummary[] = paginatedStocks.map(stock => ({
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
   * Get detailed stock information by symbol
   */
  getStock(symbol: string): Stock | null {
    return getStockBySymbol(symbol) ?? null;
  }

  /**
   * Get all unique sectors
   */
  getSectors(): string[] {
    const sectors = new Set(mockStocks.map(s => s.sector));
    return Array.from(sectors).sort();
  }

  /**
   * Get all unique exchanges
   */
  getExchanges(): string[] {
    const exchanges = new Set(mockStocks.map(s => s.exchange));
    return Array.from(exchanges).sort();
  }

  /**
   * Apply filters to stock list
   */
  private applyFilters(stocks: Stock[], filters: StockFilters): Stock[] {
    return stocks.filter(stock => {
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
      if (filters.minChange !== undefined && stock.changePercent < filters.minChange) {
        return false;
      }
      if (filters.maxChange !== undefined && stock.changePercent > filters.maxChange) {
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
   * Apply sorting to stock list
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
