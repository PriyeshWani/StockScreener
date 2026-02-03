import type { TrendAnalysis, TrendDirection, MomentumType, AnalysisSignal } from '../types/index.js';
import { mockStocks } from './mockStocks.js';

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomInRange(min, max + 1));
}

function generateTechnicalIndicators(stock: { price: number; changePercent: number }) {
  const basePrice = stock.price;
  const trend = stock.changePercent > 0 ? 1 : -1;

  const sma20 = basePrice * randomInRange(0.95, 1.05);
  const sma50 = basePrice * randomInRange(0.92, 1.08);
  const sma200 = basePrice * randomInRange(0.85, 1.15);

  const rsi = Math.min(100, Math.max(0, 50 + trend * randomInRange(10, 30)));

  return {
    rsi,
    macd: {
      value: randomInRange(-5, 5) * trend,
      signal: randomInRange(-3, 3),
      histogram: randomInRange(-2, 2) * trend,
    },
    sma20,
    sma50,
    sma200,
    ema12: basePrice * randomInRange(0.98, 1.02),
    ema26: basePrice * randomInRange(0.96, 1.04),
    bollingerBands: {
      upper: basePrice * randomInRange(1.05, 1.15),
      middle: basePrice * randomInRange(0.98, 1.02),
      lower: basePrice * randomInRange(0.85, 0.95),
    },
    atr: basePrice * randomInRange(0.02, 0.05),
    volumeRatio: randomInRange(0.7, 1.5),
  };
}

function generateSentiment(changePercent: number) {
  const baseSentiment = changePercent > 0 ? randomInRange(0.1, 0.6) : randomInRange(-0.6, -0.1);

  return {
    overall: baseSentiment,
    news: baseSentiment + randomInRange(-0.2, 0.2),
    social: baseSentiment + randomInRange(-0.3, 0.3),
    analyst: baseSentiment + randomInRange(-0.15, 0.15),
    newsCount: randomInt(5, 50),
    socialMentions: randomInt(100, 10000),
    analystRatings: {
      buy: randomInt(5, 25),
      hold: randomInt(3, 15),
      sell: randomInt(0, 8),
    },
  };
}

function determineTrend(technical: ReturnType<typeof generateTechnicalIndicators>, price: number): TrendDirection {
  const aboveSma20 = price > technical.sma20;
  const aboveSma50 = price > technical.sma50;
  const aboveSma200 = price > technical.sma200;

  const bullishCount = [aboveSma20, aboveSma50, aboveSma200].filter(Boolean).length;

  if (bullishCount >= 2 && technical.rsi > 45) return 'up';
  if (bullishCount <= 1 && technical.rsi < 55) return 'down';
  return 'sideways';
}

function determineMomentum(rsi: number, macdHistogram: number): MomentumType {
  if (rsi > 55 && macdHistogram > 0) return 'bullish';
  if (rsi < 45 && macdHistogram < 0) return 'bearish';
  return 'neutral';
}

function generateSignals(
  technical: ReturnType<typeof generateTechnicalIndicators>,
  sentiment: ReturnType<typeof generateSentiment>,
  price: number
): AnalysisSignal[] {
  const signals: AnalysisSignal[] = [];

  // RSI signals
  if (technical.rsi > 70) {
    signals.push({
      type: 'bearish',
      source: 'technical',
      indicator: 'RSI',
      description: `RSI at ${technical.rsi.toFixed(1)} indicates overbought conditions`,
      strength: Math.min(100, (technical.rsi - 70) * 3),
    });
  } else if (technical.rsi < 30) {
    signals.push({
      type: 'bullish',
      source: 'technical',
      indicator: 'RSI',
      description: `RSI at ${technical.rsi.toFixed(1)} indicates oversold conditions`,
      strength: Math.min(100, (30 - technical.rsi) * 3),
    });
  }

  // Moving average signals
  if (price > technical.sma50 && price > technical.sma200) {
    signals.push({
      type: 'bullish',
      source: 'technical',
      indicator: 'Moving Averages',
      description: 'Price above both 50-day and 200-day moving averages',
      strength: 65,
    });
  } else if (price < technical.sma50 && price < technical.sma200) {
    signals.push({
      type: 'bearish',
      source: 'technical',
      indicator: 'Moving Averages',
      description: 'Price below both 50-day and 200-day moving averages',
      strength: 65,
    });
  }

  // Golden/Death cross
  if (technical.sma50 > technical.sma200 * 1.02) {
    signals.push({
      type: 'bullish',
      source: 'technical',
      indicator: 'Golden Cross',
      description: '50-day MA above 200-day MA indicates bullish trend',
      strength: 75,
    });
  } else if (technical.sma50 < technical.sma200 * 0.98) {
    signals.push({
      type: 'bearish',
      source: 'technical',
      indicator: 'Death Cross',
      description: '50-day MA below 200-day MA indicates bearish trend',
      strength: 75,
    });
  }

  // MACD signals
  if (technical.macd.histogram > 1) {
    signals.push({
      type: 'bullish',
      source: 'technical',
      indicator: 'MACD',
      description: 'MACD histogram positive and rising',
      strength: Math.min(80, technical.macd.histogram * 20),
    });
  } else if (technical.macd.histogram < -1) {
    signals.push({
      type: 'bearish',
      source: 'technical',
      indicator: 'MACD',
      description: 'MACD histogram negative and falling',
      strength: Math.min(80, Math.abs(technical.macd.histogram) * 20),
    });
  }

  // Sentiment signals
  if (sentiment.overall > 0.3) {
    signals.push({
      type: 'bullish',
      source: 'sentiment',
      indicator: 'Market Sentiment',
      description: `Overall sentiment score of ${(sentiment.overall * 100).toFixed(0)}% positive`,
      strength: Math.min(85, sentiment.overall * 100),
    });
  } else if (sentiment.overall < -0.3) {
    signals.push({
      type: 'bearish',
      source: 'sentiment',
      indicator: 'Market Sentiment',
      description: `Overall sentiment score of ${Math.abs(sentiment.overall * 100).toFixed(0)}% negative`,
      strength: Math.min(85, Math.abs(sentiment.overall) * 100),
    });
  }

  // Volume signals
  if (technical.volumeRatio > 1.3) {
    signals.push({
      type: 'neutral',
      source: 'volume',
      indicator: 'Volume',
      description: `Volume ${((technical.volumeRatio - 1) * 100).toFixed(0)}% above average`,
      strength: Math.min(70, (technical.volumeRatio - 1) * 100),
    });
  }

  return signals;
}

function generateSupportResistance(price: number): { support: number[]; resistance: number[] } {
  return {
    support: [
      price * randomInRange(0.90, 0.95),
      price * randomInRange(0.85, 0.90),
      price * randomInRange(0.80, 0.85),
    ].sort((a, b) => b - a),
    resistance: [
      price * randomInRange(1.05, 1.10),
      price * randomInRange(1.10, 1.15),
      price * randomInRange(1.15, 1.20),
    ].sort((a, b) => a - b),
  };
}

export function generateAnalysis(symbol: string): TrendAnalysis | null {
  const stock = mockStocks.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());
  if (!stock) return null;

  const technical = generateTechnicalIndicators(stock);
  const sentiment = generateSentiment(stock.changePercent);
  const trend = determineTrend(technical, stock.price);
  const momentum = determineMomentum(technical.rsi, technical.macd.histogram);
  const signals = generateSignals(technical, sentiment, stock.price);
  const { support, resistance } = generateSupportResistance(stock.price);

  const momentumScore =
    (technical.rsi - 50) * 0.4 +
    technical.macd.histogram * 10 +
    sentiment.overall * 30;

  return {
    symbol: stock.symbol,
    direction: trend,
    strength: Math.min(100, Math.max(0, 50 + momentumScore * 0.5)),
    momentum,
    momentumScore: Math.max(-100, Math.min(100, momentumScore)),
    technical,
    sentiment,
    signals,
    support,
    resistance,
    analyzedAt: new Date().toISOString(),
  };
}

// Pre-generate analysis cache for all stocks
const analysisCache = new Map<string, TrendAnalysis>();

export function getAnalysis(symbol: string): TrendAnalysis | null {
  const upperSymbol = symbol.toUpperCase();

  if (!analysisCache.has(upperSymbol)) {
    const analysis = generateAnalysis(upperSymbol);
    if (analysis) {
      analysisCache.set(upperSymbol, analysis);
    }
  }

  return analysisCache.get(upperSymbol) ?? null;
}

export function getAllAnalysis(): TrendAnalysis[] {
  return mockStocks.map(stock => {
    if (!analysisCache.has(stock.symbol)) {
      const analysis = generateAnalysis(stock.symbol);
      if (analysis) {
        analysisCache.set(stock.symbol, analysis);
      }
    }
    return analysisCache.get(stock.symbol)!;
  }).filter(Boolean);
}

export function refreshAnalysis(symbol: string): TrendAnalysis | null {
  const upperSymbol = symbol.toUpperCase();
  const analysis = generateAnalysis(upperSymbol);
  if (analysis) {
    analysisCache.set(upperSymbol, analysis);
  }
  return analysis;
}
