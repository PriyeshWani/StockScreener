import type {
  InvestmentCriteria,
  StockRecommendation,
  RecommendationResponse,
  RecommendationFactor,
  ProfitScenario,
} from '../types/recommendation.js';
import { mockStocks } from '../data/mockStocks.js';
import { getAnalysis } from '../data/mockAnalysis.js';

function calculateDaysUntil(exitDate: string): number {
  const now = new Date();
  const target = new Date(exitDate);
  const diffTime = target.getTime() - now.getTime();
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

function assessTimeframe(days: number, targetProfit: number): 'ideal' | 'reasonable' | 'challenging' {
  // Rough heuristic: 1% per week is reasonable for swing trading
  const weeksNeeded = targetProfit / 1;
  const weeksAvailable = days / 7;

  if (weeksAvailable >= weeksNeeded * 1.5) return 'ideal';
  if (weeksAvailable >= weeksNeeded * 0.8) return 'reasonable';
  return 'challenging';
}

function generateFactors(
  stock: typeof mockStocks[0],
  analysis: ReturnType<typeof getAnalysis>,
  criteria: InvestmentCriteria,
  daysToTarget: number
): RecommendationFactor[] {
  const factors: RecommendationFactor[] = [];

  if (!analysis) return factors;

  // Momentum factor
  if (analysis.momentum === 'bullish') {
    factors.push({
      name: 'Strong Momentum',
      impact: 'supports',
      weight: 0.8,
      explanation: `${stock.symbol} shows bullish momentum with a score of ${analysis.momentumScore.toFixed(0)}. Stocks with positive momentum tend to continue their trend in the short to medium term.`,
    });
  } else if (analysis.momentum === 'bearish') {
    factors.push({
      name: 'Weak Momentum',
      impact: 'concerns',
      weight: 0.7,
      explanation: `${stock.symbol} currently shows bearish momentum. This increases the difficulty of achieving your target profit in the given timeframe.`,
    });
  } else {
    factors.push({
      name: 'Neutral Momentum',
      impact: 'neutral',
      weight: 0.5,
      explanation: `${stock.symbol} shows mixed signals with no clear directional momentum. This could go either way.`,
    });
  }

  // RSI analysis
  if (analysis.technical.rsi < 30) {
    factors.push({
      name: 'Oversold Conditions',
      impact: 'supports',
      weight: 0.75,
      explanation: `RSI at ${analysis.technical.rsi.toFixed(1)} indicates oversold conditions. Historically, oversold stocks tend to bounce back, which could support your profit target.`,
    });
  } else if (analysis.technical.rsi > 70) {
    factors.push({
      name: 'Overbought Conditions',
      impact: 'concerns',
      weight: 0.7,
      explanation: `RSI at ${analysis.technical.rsi.toFixed(1)} indicates overbought conditions. The stock may be due for a pullback, which could delay reaching your target.`,
    });
  }

  // Moving average trend
  const aboveSma50 = stock.price > analysis.technical.sma50;
  const aboveSma200 = stock.price > analysis.technical.sma200;

  if (aboveSma50 && aboveSma200) {
    factors.push({
      name: 'Strong Uptrend',
      impact: 'supports',
      weight: 0.85,
      explanation: `Price is above both 50-day and 200-day moving averages, indicating a sustained uptrend. This alignment supports continued price appreciation.`,
    });
  } else if (!aboveSma50 && !aboveSma200) {
    factors.push({
      name: 'Downtrend Pattern',
      impact: 'concerns',
      weight: 0.8,
      explanation: `Price is below major moving averages, suggesting a downtrend. Achieving profit targets may be challenging without a trend reversal.`,
    });
  }

  // Sentiment factor
  if (analysis.sentiment.overall > 0.3) {
    factors.push({
      name: 'Positive Market Sentiment',
      impact: 'supports',
      weight: 0.6,
      explanation: `Overall sentiment score of ${(analysis.sentiment.overall * 100).toFixed(0)}% is positive. News flow and social sentiment favor this stock.`,
    });
  } else if (analysis.sentiment.overall < -0.3) {
    factors.push({
      name: 'Negative Market Sentiment',
      impact: 'concerns',
      weight: 0.55,
      explanation: `Sentiment is currently negative at ${(analysis.sentiment.overall * 100).toFixed(0)}%. This headwind may slow price appreciation.`,
    });
  }

  // Volatility/Beta factor
  const beta = stock.beta ?? 1;
  if (beta > 1.5) {
    factors.push({
      name: 'High Volatility',
      impact: criteria.riskTolerancePercent > 10 ? 'supports' : 'concerns',
      weight: 0.7,
      explanation: `Beta of ${beta.toFixed(2)} means this stock moves ${((beta - 1) * 100).toFixed(0)}% more than the market. ${
        criteria.riskTolerancePercent > 10
          ? 'This volatility could help reach your target faster.'
          : 'This exceeds typical risk tolerance and may cause uncomfortable drawdowns.'
      }`,
    });
  } else if (beta < 0.8) {
    factors.push({
      name: 'Low Volatility',
      impact: criteria.targetProfitPercent > 15 ? 'concerns' : 'supports',
      weight: 0.6,
      explanation: `Beta of ${beta.toFixed(2)} indicates lower volatility than the market. ${
        criteria.targetProfitPercent > 15
          ? 'This stability may make it harder to achieve aggressive profit targets.'
          : 'This stability aligns well with moderate profit expectations.'
      }`,
    });
  }

  // Timeframe assessment
  const timeframe = assessTimeframe(daysToTarget, criteria.targetProfitPercent);
  if (timeframe === 'ideal') {
    factors.push({
      name: 'Favorable Timeframe',
      impact: 'supports',
      weight: 0.65,
      explanation: `${daysToTarget} days provides adequate time to achieve ${criteria.targetProfitPercent}% profit without requiring unusual market conditions.`,
    });
  } else if (timeframe === 'challenging') {
    factors.push({
      name: 'Tight Timeframe',
      impact: 'concerns',
      weight: 0.75,
      explanation: `Achieving ${criteria.targetProfitPercent}% in ${daysToTarget} days is aggressive. This would require strong positive catalysts or above-average market conditions.`,
    });
  }

  // Analyst ratings
  const { buy, hold, sell } = analysis.sentiment.analystRatings;
  const total = buy + hold + sell;
  if (total > 0) {
    const buyRatio = buy / total;
    if (buyRatio > 0.6) {
      factors.push({
        name: 'Strong Analyst Support',
        impact: 'supports',
        weight: 0.5,
        explanation: `${Math.round(buyRatio * 100)}% of analysts rate this stock as a Buy. Wall Street consensus supports the bullish case.`,
      });
    } else if (buyRatio < 0.3) {
      factors.push({
        name: 'Weak Analyst Ratings',
        impact: 'concerns',
        weight: 0.45,
        explanation: `Only ${Math.round(buyRatio * 100)}% of analysts rate this as a Buy. Limited institutional support may cap upside.`,
      });
    }
  }

  return factors;
}

function generateScenarios(
  stock: typeof mockStocks[0],
  _analysis: ReturnType<typeof getAnalysis>,
  criteria: InvestmentCriteria,
  probabilityScore: number
): ProfitScenario[] {
  const beta = stock.beta ?? 1;
  const volatilityFactor = beta * 0.8;

  // Base case: slightly below target (realistic)
  const baseReturn = criteria.targetProfitPercent * 0.7 * (probabilityScore / 100);

  // Optimistic: exceeds target
  const optimisticReturn = criteria.targetProfitPercent * 1.5 * Math.min(1, probabilityScore / 80);

  // Pessimistic: potential loss
  const pessimisticReturn = -criteria.riskTolerancePercent * (1 + volatilityFactor * 0.3);

  // Calculate probabilities that sum to ~100%
  const optimisticProb = Math.min(35, probabilityScore * 0.4);
  const baseProb = Math.min(45, probabilityScore * 0.6);
  const pessimisticProb = 100 - optimisticProb - baseProb;

  return [
    {
      scenario: 'optimistic',
      probability: Math.round(optimisticProb),
      expectedReturn: Math.round(optimisticReturn * 100) / 100,
      priceTarget: Math.round(stock.price * (1 + optimisticReturn / 100) * 100) / 100,
    },
    {
      scenario: 'base',
      probability: Math.round(baseProb),
      expectedReturn: Math.round(baseReturn * 100) / 100,
      priceTarget: Math.round(stock.price * (1 + baseReturn / 100) * 100) / 100,
    },
    {
      scenario: 'pessimistic',
      probability: Math.round(pessimisticProb),
      expectedReturn: Math.round(pessimisticReturn * 100) / 100,
      priceTarget: Math.round(stock.price * (1 + pessimisticReturn / 100) * 100) / 100,
    },
  ];
}

function generateSummary(
  stock: typeof mockStocks[0],
  probabilityScore: number,
  factors: RecommendationFactor[],
  criteria: InvestmentCriteria,
  daysToTarget: number
): string {
  const supportingFactors = factors.filter(f => f.impact === 'supports');
  const concernFactors = factors.filter(f => f.impact === 'concerns');

  let summary = `${stock.symbol} has a ${probabilityScore}% probability of achieving your ${criteria.targetProfitPercent}% profit target within ${daysToTarget} days. `;

  if (supportingFactors.length > concernFactors.length) {
    summary += `The analysis is supported by ${supportingFactors.length} positive factors including ${supportingFactors.slice(0, 2).map(f => f.name.toLowerCase()).join(' and ')}. `;
  } else if (concernFactors.length > supportingFactors.length) {
    summary += `However, there are ${concernFactors.length} concerns including ${concernFactors.slice(0, 2).map(f => f.name.toLowerCase()).join(' and ')}. `;
  }

  if (probabilityScore >= 60) {
    summary += `Given your risk tolerance of ${criteria.riskTolerancePercent}%, this represents a reasonable risk-reward opportunity.`;
  } else if (probabilityScore >= 40) {
    summary += `The probability is moderate, suggesting careful position sizing and stop-loss placement.`;
  } else {
    summary += `The low probability suggests this may not align well with your criteria.`;
  }

  return summary;
}

function generateRisks(
  stock: typeof mockStocks[0],
  analysis: ReturnType<typeof getAnalysis>,
  criteria: InvestmentCriteria
): string[] {
  const risks: string[] = [];

  const beta = stock.beta ?? 1;
  if (beta > 1.3) {
    risks.push(`High beta (${beta.toFixed(2)}) means larger price swings that could exceed your ${criteria.riskTolerancePercent}% risk tolerance`);
  }

  if (analysis && analysis.technical.rsi > 70) {
    risks.push('Overbought conditions may lead to a near-term pullback');
  }

  if (analysis && analysis.sentiment.overall < 0) {
    risks.push('Negative market sentiment could create headwinds');
  }

  risks.push('Unexpected macroeconomic events could impact all equities');
  risks.push('Company-specific news or earnings surprises could cause rapid price changes');

  if (stock.sector === 'Technology' || stock.sector === 'Consumer Cyclical') {
    risks.push(`${stock.sector} sector is sensitive to interest rate changes and economic cycles`);
  }

  return risks.slice(0, 4);
}

function generateCatalysts(
  stock: typeof mockStocks[0],
  analysis: ReturnType<typeof getAnalysis>
): string[] {
  const catalysts: string[] = [];

  const sectorCatalysts: Record<string, string[]> = {
    Technology: ['AI and cloud computing tailwinds', 'Strong enterprise spending', 'Product launch cycles'],
    Healthcare: ['Drug pipeline progress', 'FDA approvals', 'M&A activity in the sector'],
    Finance: ['Interest rate environment', 'Strong loan growth', 'Capital returns to shareholders'],
    'Consumer Cyclical': ['Consumer spending resilience', 'E-commerce growth', 'Market share gains'],
    'Consumer Defensive': ['Pricing power in inflationary environment', 'Dividend growth', 'Stable demand'],
    Energy: ['Oil price movements', 'Production growth', 'Capital discipline'],
    'Communication Services': ['Advertising recovery', 'Subscriber growth', 'Content investment payoff'],
  };

  const sectorSpecific = sectorCatalysts[stock.sector] ?? ['Sector momentum', 'Market rotation'];
  catalysts.push(...sectorSpecific.slice(0, 2));

  if (analysis && analysis.technical.sma50 > analysis.technical.sma200 * 0.98) {
    catalysts.push('Potential golden cross formation on technical charts');
  }

  if (analysis && analysis.sentiment.analystRatings.buy > analysis.sentiment.analystRatings.hold) {
    catalysts.push('Potential price target upgrades from analysts');
  }

  catalysts.push('Positive earnings surprise potential');

  return catalysts.slice(0, 4);
}

function calculateProbabilityScore(
  stock: typeof mockStocks[0],
  analysis: ReturnType<typeof getAnalysis>,
  criteria: InvestmentCriteria,
  daysToTarget: number
): number {
  let score = 50; // Base score

  if (!analysis) return 30;

  // Momentum contribution (+/- 15)
  if (analysis.momentum === 'bullish') score += 15;
  else if (analysis.momentum === 'bearish') score -= 15;

  // RSI contribution (+/- 10)
  if (analysis.technical.rsi < 35) score += 10;
  else if (analysis.technical.rsi > 65) score -= 5;

  // Trend contribution (+/- 12)
  if (stock.price > analysis.technical.sma50 && stock.price > analysis.technical.sma200) {
    score += 12;
  } else if (stock.price < analysis.technical.sma50 && stock.price < analysis.technical.sma200) {
    score -= 12;
  }

  // Sentiment contribution (+/- 8)
  score += Math.round(analysis.sentiment.overall * 8);

  // Timeframe penalty
  const timeframe = assessTimeframe(daysToTarget, criteria.targetProfitPercent);
  if (timeframe === 'challenging') score -= 15;
  else if (timeframe === 'ideal') score += 5;

  // Target difficulty adjustment
  if (criteria.targetProfitPercent > 20) score -= 10;
  else if (criteria.targetProfitPercent > 15) score -= 5;
  else if (criteria.targetProfitPercent < 5) score += 5;

  // Risk tolerance alignment
  const beta = stock.beta ?? 1;
  const impliedRisk = beta * 8; // Rough estimate of typical drawdown
  if (impliedRisk > criteria.riskTolerancePercent * 1.5) {
    score -= 8; // Stock is riskier than user's tolerance
  }

  // Clamp score
  return Math.max(10, Math.min(90, score));
}

function determineRating(probabilityScore: number, riskScore: number): StockRecommendation['overallRating'] {
  const composite = probabilityScore - (riskScore * 0.3);

  if (composite >= 65) return 'strong_buy';
  if (composite >= 50) return 'buy';
  if (composite >= 35) return 'hold';
  return 'avoid';
}

export class RecommendationService {
  generateRecommendations(criteria: InvestmentCriteria): RecommendationResponse {
    const daysToTarget = calculateDaysUntil(criteria.exitDate);
    const recommendations: StockRecommendation[] = [];

    for (const stock of mockStocks) {
      const analysis = getAnalysis(stock.symbol);

      const probabilityScore = calculateProbabilityScore(stock, analysis, criteria, daysToTarget);
      const beta = stock.beta ?? 1;
      const riskScore = Math.min(100, Math.round(beta * 35 + (analysis?.technical.rsi ?? 50) * 0.3));
      const confidenceScore = analysis ? Math.round(60 + Math.random() * 25) : 40;

      const factors = generateFactors(stock, analysis, criteria, daysToTarget);
      const scenarios = generateScenarios(stock, analysis, criteria, probabilityScore);

      const expectedReturn = scenarios.reduce((acc, s) => acc + (s.expectedReturn * s.probability / 100), 0);
      const maxDrawdown = Math.round(beta * criteria.riskTolerancePercent * 1.2 * 10) / 10;

      const recommendation: StockRecommendation = {
        symbol: stock.symbol,
        name: stock.name,
        currentPrice: stock.price,
        sector: stock.sector,

        probabilityScore: Math.round(probabilityScore),
        riskScore,
        confidenceScore,
        overallRating: determineRating(probabilityScore, riskScore),

        expectedReturn: Math.round(expectedReturn * 100) / 100,
        maxDrawdown,
        scenarios,

        factors,
        summary: generateSummary(stock, Math.round(probabilityScore), factors, criteria, daysToTarget),
        risks: generateRisks(stock, analysis, criteria),
        catalysts: generateCatalysts(stock, analysis),

        daysToTarget,
        timeframeRating: assessTimeframe(daysToTarget, criteria.targetProfitPercent),
      };

      recommendations.push(recommendation);
    }

    // Sort by probability score (highest first)
    recommendations.sort((a, b) => b.probabilityScore - a.probabilityScore);

    // Determine market context
    const avgMomentum = recommendations.reduce((acc, r) => acc + r.probabilityScore, 0) / recommendations.length;
    const marketCondition = avgMomentum > 55 ? 'bullish' : avgMomentum < 45 ? 'bearish' : 'neutral';

    const avgRisk = recommendations.reduce((acc, r) => acc + r.riskScore, 0) / recommendations.length;
    const volatilityLevel = avgRisk > 60 ? 'high' : avgRisk > 40 ? 'moderate' : 'low';

    return {
      criteria,
      recommendations: recommendations.slice(0, 15), // Return top 15
      marketContext: {
        condition: marketCondition,
        volatilityLevel,
        note: `Current market conditions are ${marketCondition} with ${volatilityLevel} volatility. ${
          marketCondition === 'bullish'
            ? 'This environment generally favors achieving profit targets.'
            : marketCondition === 'bearish'
            ? 'Consider more conservative position sizing in this environment.'
            : 'Mixed conditions suggest selectivity in stock selection.'
        }`,
      },
      disclaimer: 'This analysis is for informational purposes only and does not constitute financial advice. Past performance does not guarantee future results. Always conduct your own research and consider consulting a financial advisor before making investment decisions.',
      generatedAt: new Date().toISOString(),
    };
  }
}

export const recommendationService = new RecommendationService();
