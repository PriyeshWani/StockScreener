/**
 * Stock movement prediction types
 */

export type MovementDirection = 'up' | 'down';

export type TimeHorizon = 'short' | 'medium' | 'long';

export interface MovementFactor {
  category: 'technical' | 'fundamental' | 'sentiment' | 'macro' | 'sector';
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number; // 0-1
  description: string;
}

export interface PriceTarget {
  low: number;
  mid: number;
  high: number;
  timeframe: string;
}

export interface MovementPrediction {
  symbol: string;
  name: string;
  currentPrice: number;
  predictedDirection: MovementDirection;
  confidence: number; // 0-100
  expectedMovePercent: number;
  priceTarget: PriceTarget;
  timeHorizon: TimeHorizon;
  factors: MovementFactor[];
  riskLevel: 'low' | 'medium' | 'high';
  volatilityScore: number; // 0-100
  sector: string;
  catalysts: string[];
  lastUpdated: string;
}

export interface MovementFilters {
  direction?: MovementDirection;
  minConfidence?: number;
  maxConfidence?: number;
  minExpectedMove?: number;
  maxExpectedMove?: number;
  timeHorizon?: TimeHorizon;
  riskLevel?: 'low' | 'medium' | 'high';
  sector?: string;
  sectors?: string[];
  sortBy?: 'confidence' | 'expectedMove' | 'volatility' | 'symbol';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
