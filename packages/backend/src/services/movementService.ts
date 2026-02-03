import type {
  MovementPrediction,
  MovementFilters,
  MovementFactor,
  PriceTarget,
  TimeHorizon,
  PaginatedResponse,
} from '../types/index.js';
import { mockStocks } from '../data/mockStocks.js';
import { getAnalysis } from '../data/mockAnalysis.js';

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateFactors(analysis: ReturnType<typeof getAnalysis>, stock: typeof mockStocks[0]): MovementFactor[] {
  const factors: MovementFactor[] = [];

  if (!analysis) return factors;

  // Technical factors
  if (analysis.technical.rsi > 70) {
    factors.push({
      category: 'technical',
      name: 'RSI Overbought',
      impact: 'negative',
      weight: 0.7,
      description: 'RSI indicates overbought conditions',
    });
  } else if (analysis.technical.rsi < 30) {
    factors.push({
      category: 'technical',
      name: 'RSI Oversold',
      impact: 'positive',
      weight: 0.7,
      description: 'RSI indicates oversold conditions',
    });
  }

  if (analysis.technical.macd.histogram > 0) {
    factors.push({
      category: 'technical',
      name: 'MACD Bullish',
      impact: 'positive',
      weight: 0.6,
      description: 'MACD histogram is positive',
    });
  } else {
    factors.push({
      category: 'technical',
      name: 'MACD Bearish',
      impact: 'negative',
      weight: 0.6,
      description: 'MACD histogram is negative',
    });
  }

  // Moving average factor
  const aboveSma50 = stock.price > analysis.technical.sma50;
  const aboveSma200 = stock.price > analysis.technical.sma200;

  if (aboveSma50 && aboveSma200) {
    factors.push({
      category: 'technical',
      name: 'Strong Uptrend',
      impact: 'positive',
      weight: 0.8,
      description: 'Price above major moving averages',
    });
  } else if (!aboveSma50 && !aboveSma200) {
    factors.push({
      category: 'technical',
      name: 'Strong Downtrend',
      impact: 'negative',
      weight: 0.8,
      description: 'Price below major moving averages',
    });
  }

  // Sentiment factors
  if (analysis.sentiment.overall > 0.3) {
    factors.push({
      category: 'sentiment',
      name: 'Positive Sentiment',
      impact: 'positive',
      weight: 0.5,
      description: 'Overall market sentiment is bullish',
    });
  } else if (analysis.sentiment.overall < -0.3) {
    factors.push({
      category: 'sentiment',
      name: 'Negative Sentiment',
      impact: 'negative',
      weight: 0.5,
      description: 'Overall market sentiment is bearish',
    });
  }

  // Analyst ratings
  const { buy, hold, sell } = analysis.sentiment.analystRatings;
  const totalRatings = buy + hold + sell;
  if (totalRatings > 0) {
    const buyRatio = buy / totalRatings;
    if (buyRatio > 0.6) {
      factors.push({
        category: 'fundamental',
        name: 'Strong Analyst Buy',
        impact: 'positive',
        weight: 0.65,
        description: `${Math.round(buyRatio * 100)}% of analysts rate as buy`,
      });
    } else if (buyRatio < 0.3) {
      factors.push({
        category: 'fundamental',
        name: 'Weak Analyst Rating',
        impact: 'negative',
        weight: 0.6,
        description: 'Majority of analysts are neutral or bearish',
      });
    }
  }

  // Volume factor
  if (analysis.technical.volumeRatio > 1.2) {
    factors.push({
      category: 'technical',
      name: 'High Volume',
      impact: stock.changePercent > 0 ? 'positive' : 'negative',
      weight: 0.4,
      description: 'Trading volume above average',
    });
  }

  // Sector momentum (simulated)
  factors.push({
    category: 'sector',
    name: `${stock.sector} Sector`,
    impact: randomInRange(0, 1) > 0.5 ? 'positive' : 'neutral',
    weight: 0.35,
    description: `${stock.sector} sector momentum`,
  });

  // Macro factor (simulated)
  factors.push({
    category: 'macro',
    name: 'Market Conditions',
    impact: randomInRange(0, 1) > 0.4 ? 'positive' : 'neutral',
    weight: 0.3,
    description: 'Overall market conditions',
  });

  return factors;
}

function generatePriceTarget(
  currentPrice: number,
  direction: 'up' | 'down',
  confidence: number
): PriceTarget {
  const baseMove = direction === 'up'
    ? randomInRange(0.05, 0.15)
    : randomInRange(-0.15, -0.05);

  const confidenceMultiplier = confidence / 100;

  return {
    low: currentPrice * (1 + baseMove * 0.5 * confidenceMultiplier),
    mid: currentPrice * (1 + baseMove * confidenceMultiplier),
    high: currentPrice * (1 + baseMove * 1.5 * confidenceMultiplier),
    timeframe: '3-6 months',
  };
}

function generateCatalysts(sector: string, direction: 'up' | 'down'): string[] {
  const bullishCatalysts: Record<string, string[]> = {
    Technology: ['AI expansion', 'Cloud growth', 'New product launch'],
    Healthcare: ['FDA approval', 'Earnings beat', 'Pipeline progress'],
    Finance: ['Rate environment', 'Loan growth', 'Dividend increase'],
    Energy: ['Oil price strength', 'Production increase', 'Cost efficiency'],
    'Consumer Cyclical': ['Consumer spending', 'Market share gains', 'E-commerce growth'],
    'Consumer Defensive': ['Stable demand', 'Pricing power', 'Dividend growth'],
    'Communication Services': ['Subscriber growth', 'Ad revenue', 'Content investment'],
    Industrials: ['Infrastructure spending', 'Order backlog', 'Supply chain improvement'],
    'Basic Materials': ['Commodity prices', 'Demand recovery', 'Cost reduction'],
    'Real Estate': ['Occupancy rates', 'Rent growth', 'Property values'],
    Utilities: ['Rate increases', 'Renewable investment', 'Regulatory support'],
  };

  const bearishCatalysts: Record<string, string[]> = {
    Technology: ['Valuation concerns', 'Competition', 'Regulatory pressure'],
    Healthcare: ['Pricing pressure', 'Patent expiry', 'Clinical failure'],
    Finance: ['Credit risk', 'Rate pressure', 'Regulatory costs'],
    Energy: ['Oil price weakness', 'Transition risk', 'Environmental costs'],
    'Consumer Cyclical': ['Consumer weakness', 'Inventory issues', 'Margin pressure'],
    'Consumer Defensive': ['Cost inflation', 'Volume decline', 'Competition'],
    'Communication Services': ['Cord cutting', 'Ad weakness', 'Content costs'],
    Industrials: ['Economic slowdown', 'Supply chain', 'Labor costs'],
    'Basic Materials': ['Commodity weakness', 'Demand decline', 'Overcapacity'],
    'Real Estate': ['Rate sensitivity', 'Vacancy rates', 'Cap rate expansion'],
    Utilities: ['Rate case risk', 'Storm costs', 'Capital needs'],
  };

  const catalysts = direction === 'up' ? bullishCatalysts : bearishCatalysts;
  const sectorCatalysts = catalysts[sector] ?? ['Market conditions', 'Earnings outlook'];

  // Return 2-3 random catalysts
  const shuffled = [...sectorCatalysts].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.floor(randomInRange(2, 4)));
}

export class MovementService {
  private movementCache: Map<string, MovementPrediction> = new Map();

  /**
   * Get all movement predictions with filtering
   */
  getMovements(filters: MovementFilters): PaginatedResponse<MovementPrediction> {
    // Generate predictions for all stocks if not cached
    this.ensurePredictionsGenerated();

    let predictions = Array.from(this.movementCache.values());

    // Apply filters
    predictions = this.applyFilters(predictions, filters);

    // Apply sorting
    predictions = this.applySorting(predictions, filters.sortBy, filters.sortOrder);

    // Get total before pagination
    const total = predictions.length;

    // Apply pagination
    const limit = filters.limit ?? 20;
    const offset = filters.offset ?? 0;
    const paginatedPredictions = predictions.slice(offset, offset + limit);

    return {
      data: paginatedPredictions,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get movement prediction for a specific stock
   */
  getMovement(symbol: string): MovementPrediction | null {
    this.ensurePredictionsGenerated();
    return this.movementCache.get(symbol.toUpperCase()) ?? null;
  }

  /**
   * Ensure predictions are generated for all stocks
   */
  private ensurePredictionsGenerated(): void {
    if (this.movementCache.size === 0) {
      mockStocks.forEach(stock => {
        const prediction = this.generatePrediction(stock);
        this.movementCache.set(stock.symbol, prediction);
      });
    }
  }

  /**
   * Generate a movement prediction for a stock
   */
  private generatePrediction(stock: typeof mockStocks[0]): MovementPrediction {
    const analysis = getAnalysis(stock.symbol);

    // Determine direction based on analysis
    let direction: 'up' | 'down' = 'up';
    let confidence = 50;

    if (analysis) {
      const momentumScore = analysis.momentumScore;
      direction = momentumScore > 0 ? 'up' : 'down';
      confidence = Math.min(95, Math.max(30, 50 + Math.abs(momentumScore) * 0.4));
    } else {
      direction = stock.changePercent > 0 ? 'up' : 'down';
      confidence = Math.min(80, Math.max(35, 50 + Math.abs(stock.changePercent) * 5));
    }

    // Add some randomness to confidence
    confidence = Math.round(confidence + randomInRange(-10, 10));
    confidence = Math.min(95, Math.max(30, confidence));

    // Generate expected move based on volatility
    const volatility = stock.beta ?? 1;
    const expectedMovePercent = direction === 'up'
      ? randomInRange(3, 12) * volatility
      : -randomInRange(3, 12) * volatility;

    // Determine time horizon
    const timeHorizon: TimeHorizon = confidence > 70 ? 'short' : confidence > 50 ? 'medium' : 'long';

    // Determine risk level
    const volatilityScore = Math.min(100, Math.round(volatility * 40));
    const riskLevel = volatilityScore > 70 ? 'high' : volatilityScore > 40 ? 'medium' : 'low';

    return {
      symbol: stock.symbol,
      name: stock.name,
      currentPrice: stock.price,
      predictedDirection: direction,
      confidence: Math.round(confidence),
      expectedMovePercent: Math.round(expectedMovePercent * 100) / 100,
      priceTarget: generatePriceTarget(stock.price, direction, confidence),
      timeHorizon,
      factors: generateFactors(analysis, stock),
      riskLevel,
      volatilityScore,
      sector: stock.sector,
      catalysts: generateCatalysts(stock.sector, direction),
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Apply filters to predictions
   */
  private applyFilters(
    predictions: MovementPrediction[],
    filters: MovementFilters
  ): MovementPrediction[] {
    return predictions.filter(prediction => {
      // Direction filter
      if (filters.direction && prediction.predictedDirection !== filters.direction) {
        return false;
      }

      // Confidence range
      if (filters.minConfidence !== undefined && prediction.confidence < filters.minConfidence) {
        return false;
      }
      if (filters.maxConfidence !== undefined && prediction.confidence > filters.maxConfidence) {
        return false;
      }

      // Expected move range
      const absMove = Math.abs(prediction.expectedMovePercent);
      if (filters.minExpectedMove !== undefined && absMove < filters.minExpectedMove) {
        return false;
      }
      if (filters.maxExpectedMove !== undefined && absMove > filters.maxExpectedMove) {
        return false;
      }

      // Time horizon filter
      if (filters.timeHorizon && prediction.timeHorizon !== filters.timeHorizon) {
        return false;
      }

      // Risk level filter
      if (filters.riskLevel && prediction.riskLevel !== filters.riskLevel) {
        return false;
      }

      // Sector filter
      if (filters.sector && prediction.sector !== filters.sector) {
        return false;
      }
      if (filters.sectors && filters.sectors.length > 0) {
        if (!filters.sectors.includes(prediction.sector)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Apply sorting to predictions
   */
  private applySorting(
    predictions: MovementPrediction[],
    sortBy?: MovementFilters['sortBy'],
    sortOrder: 'asc' | 'desc' = 'desc'
  ): MovementPrediction[] {
    if (!sortBy) {
      // Default: sort by confidence descending
      return predictions.sort((a, b) => b.confidence - a.confidence);
    }

    const multiplier = sortOrder === 'asc' ? 1 : -1;

    return predictions.sort((a, b) => {
      switch (sortBy) {
        case 'confidence':
          return (a.confidence - b.confidence) * multiplier;
        case 'expectedMove':
          return (Math.abs(a.expectedMovePercent) - Math.abs(b.expectedMovePercent)) * multiplier;
        case 'volatility':
          return (a.volatilityScore - b.volatilityScore) * multiplier;
        case 'symbol':
          return a.symbol.localeCompare(b.symbol) * multiplier;
        default:
          return 0;
      }
    });
  }
}

export const movementService = new MovementService();
