// Stock types
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
  marketCapCategory: 'small' | 'mid' | 'large' | 'mega';
  sector: string;
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

// Technical indicators
export interface TechnicalIndicators {
  rsi: number;
  macd: {
    value: number;
    signal: number;
    histogram: number;
  };
  sma20: number;
  sma50: number;
  sma200: number;
  ema12: number;
  ema26: number;
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  atr: number;
  volumeRatio: number;
}

// Sentiment data
export interface SentimentData {
  overall: number;
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

// Analysis signal
export interface AnalysisSignal {
  type: 'bullish' | 'bearish' | 'neutral';
  source: 'technical' | 'sentiment' | 'fundamental' | 'volume';
  indicator: string;
  description: string;
  strength: number;
}

// Full trend analysis
export interface TrendAnalysis {
  symbol: string;
  direction: 'up' | 'down' | 'sideways';
  strength: number;
  momentum: 'bullish' | 'bearish' | 'neutral';
  momentumScore: number;
  technical: TechnicalIndicators;
  sentiment: SentimentData;
  signals: AnalysisSignal[];
  support: number[];
  resistance: number[];
  analyzedAt: string;
}

// Movement factor
export interface MovementFactor {
  category: 'technical' | 'fundamental' | 'sentiment' | 'macro' | 'sector';
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

// Price target
export interface PriceTarget {
  low: number;
  mid: number;
  high: number;
  timeframe: string;
}

// Movement prediction
export interface MovementPrediction {
  symbol: string;
  name: string;
  currentPrice: number;
  predictedDirection: 'up' | 'down';
  confidence: number;
  expectedMovePercent: number;
  priceTarget: PriceTarget;
  timeHorizon: 'short' | 'medium' | 'long';
  factors: MovementFactor[];
  riskLevel: 'low' | 'medium' | 'high';
  volatilityScore: number;
  sector: string;
  catalysts: string[];
  lastUpdated: string;
}

// Screener filters
export interface ScreenerFilters {
  sectors?: string[];
  minMarketCap?: number;
  maxMarketCap?: number;
  minPrice?: number;
  maxPrice?: number;
  direction?: 'up' | 'down' | 'sideways';
  momentum?: 'bullish' | 'bearish' | 'neutral';
  minMomentum?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Investment criteria for recommendations
export interface InvestmentCriteria {
  targetProfitPercent: number;
  riskTolerancePercent: number;
  exitDate: string;
  investmentAmount?: number;
}

// Recommendation factor
export interface RecommendationFactor {
  name: string;
  impact: 'supports' | 'neutral' | 'concerns';
  weight: number;
  explanation: string;
}

// Profit scenario
export interface ProfitScenario {
  scenario: 'optimistic' | 'base' | 'pessimistic';
  probability: number;
  expectedReturn: number;
  priceTarget: number;
}

// Stock recommendation
export interface StockRecommendation {
  symbol: string;
  name: string;
  currentPrice: number;
  sector: string;
  probabilityScore: number;
  riskScore: number;
  confidenceScore: number;
  overallRating: 'strong_buy' | 'buy' | 'hold' | 'avoid';
  expectedReturn: number;
  maxDrawdown: number;
  scenarios: ProfitScenario[];
  factors: RecommendationFactor[];
  summary: string;
  risks: string[];
  catalysts: string[];
  daysToTarget: number;
  timeframeRating: 'ideal' | 'reasonable' | 'challenging';
}

// Recommendation response
export interface RecommendationResponse {
  criteria: InvestmentCriteria;
  recommendations: StockRecommendation[];
  marketContext: {
    condition: 'bullish' | 'bearish' | 'neutral';
    volatilityLevel: 'low' | 'moderate' | 'high';
    note: string;
  };
  disclaimer: string;
  generatedAt: string;
}
