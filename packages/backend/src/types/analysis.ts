/**
 * Stock analysis and trend types
 */

import type { MomentumType, TrendDirection } from './stock.js';

export interface TechnicalIndicators {
  rsi: number; // Relative Strength Index (0-100)
  macd: {
    value: number;
    signal: number;
    histogram: number;
  };
  sma20: number; // 20-day Simple Moving Average
  sma50: number; // 50-day Simple Moving Average
  sma200: number; // 200-day Simple Moving Average
  ema12: number; // 12-day Exponential Moving Average
  ema26: number; // 26-day Exponential Moving Average
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  atr: number; // Average True Range
  volumeRatio: number; // Current volume / Average volume
}

export interface SentimentData {
  overall: number; // -1 to 1 scale
  news: number;
  social: number;
  analyst: number;
  newsCount: number;
  socialMentions: number;
  analystRatings: {
    buy: number;
    hold: number;
    sell: number;
  };
}

export interface TrendAnalysis {
  symbol: string;
  direction: TrendDirection;
  strength: number; // 0-100
  momentum: MomentumType;
  momentumScore: number; // -100 to 100
  technical: TechnicalIndicators;
  sentiment: SentimentData;
  signals: AnalysisSignal[];
  support: number[];
  resistance: number[];
  analyzedAt: string;
}

export interface AnalysisSignal {
  type: 'bullish' | 'bearish' | 'neutral';
  source: 'technical' | 'sentiment' | 'fundamental' | 'volume';
  indicator: string;
  description: string;
  strength: number; // 0-100
}

export interface ScreenerFilters {
  // Stock filters
  sector?: string;
  sectors?: string[];
  marketCap?: string;
  marketCaps?: string[];
  minPrice?: number;
  maxPrice?: number;
  minChange?: number;
  maxChange?: number;
  minVolume?: number;

  // Analysis filters
  momentum?: MomentumType;
  trend?: TrendDirection;
  minSentiment?: number;
  maxSentiment?: number;
  minRsi?: number;
  maxRsi?: number;
  aboveSma20?: boolean;
  aboveSma50?: boolean;
  aboveSma200?: boolean;
  goldenCross?: boolean; // SMA50 crossed above SMA200
  deathCross?: boolean; // SMA50 crossed below SMA200

  // Pagination
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ScreenerResult {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sector: string;
  trend: TrendDirection;
  momentum: MomentumType;
  momentumScore: number;
  sentimentScore: number;
  rsi: number;
  signals: AnalysisSignal[];
}
