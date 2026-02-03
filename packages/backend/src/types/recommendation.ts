/**
 * Stock recommendation types based on user investment criteria
 */

export interface InvestmentCriteria {
  targetProfitPercent: number;    // Target profit in percentage (e.g., 10 for 10%)
  riskTolerancePercent: number;   // Max acceptable loss in percentage (e.g., 5 for 5%)
  exitDate: string;               // Target exit date (ISO string)
  investmentAmount?: number;      // Optional: amount to invest
}

export interface RecommendationFactor {
  name: string;
  impact: 'supports' | 'neutral' | 'concerns';
  weight: number;                 // 0-1
  explanation: string;
}

export interface ProfitScenario {
  scenario: 'optimistic' | 'base' | 'pessimistic';
  probability: number;            // 0-100
  expectedReturn: number;         // percentage
  priceTarget: number;
}

export interface StockRecommendation {
  symbol: string;
  name: string;
  currentPrice: number;
  sector: string;

  // Probability and scores
  probabilityScore: number;       // 0-100, likelihood of hitting target
  riskScore: number;              // 0-100, higher = riskier
  confidenceScore: number;        // 0-100, confidence in the analysis
  overallRating: 'strong_buy' | 'buy' | 'hold' | 'avoid';

  // Analysis
  expectedReturn: number;         // Expected return percentage
  maxDrawdown: number;            // Expected max loss percentage
  scenarios: ProfitScenario[];

  // Explanations
  factors: RecommendationFactor[];
  summary: string;                // Human-readable summary
  risks: string[];                // Key risks to consider
  catalysts: string[];            // Potential positive catalysts

  // Time analysis
  daysToTarget: number;
  timeframeRating: 'ideal' | 'reasonable' | 'challenging';
}

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
