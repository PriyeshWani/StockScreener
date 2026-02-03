/**
 * Core stock data types for the Stock Screener application
 */

export type Sector =
  | 'Technology'
  | 'Healthcare'
  | 'Finance'
  | 'Consumer Cyclical'
  | 'Consumer Defensive'
  | 'Energy'
  | 'Industrials'
  | 'Basic Materials'
  | 'Real Estate'
  | 'Utilities'
  | 'Communication Services';

export type MarketCapCategory = 'small' | 'mid' | 'large' | 'mega';

export type TrendDirection = 'up' | 'down' | 'sideways';

export type MomentumType = 'bullish' | 'bearish' | 'neutral';

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  marketCapCategory: MarketCapCategory;
  sector: Sector;
  industry: string;
  exchange: string;
  high52Week: number;
  low52Week: number;
  dayHigh: number;
  dayLow: number;
  open: number;
  pe?: number;
  eps?: number;
  dividend?: number;
  dividendYield?: number;
  beta?: number;
  lastUpdated: string;
}

export interface StockSummary {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  marketCapCategory: MarketCapCategory;
  sector: Sector;
}

export interface StockFilters {
  sector?: Sector;
  sectors?: Sector[];
  marketCap?: MarketCapCategory;
  marketCaps?: MarketCapCategory[];
  minPrice?: number;
  maxPrice?: number;
  minChange?: number;
  maxChange?: number;
  minVolume?: number;
  maxVolume?: number;
  exchange?: string;
  search?: string;
  sortBy?: 'price' | 'change' | 'changePercent' | 'volume' | 'marketCap' | 'name' | 'symbol';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
