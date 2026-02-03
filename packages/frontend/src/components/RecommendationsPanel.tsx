import { useState } from 'react';
import type { RecommendationResponse, StockRecommendation } from '../types';
import { recommendationApi } from '../services/api';

export function RecommendationsPanel() {
  const [targetProfit, setTargetProfit] = useState(10);
  const [riskTolerance, setRiskTolerance] = useState(5);
  const [exitDate, setExitDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    return date.toISOString().split('T')[0];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [expandedStock, setExpandedStock] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const response = await recommendationApi.get({
      targetProfit,
      riskTolerance,
      exitDate,
    });

    if (response.success && response.data) {
      setResult(response.data);
    } else {
      setError(response.error?.message ?? 'Failed to get recommendations');
    }

    setLoading(false);
  };

  const getRatingColor = (rating: StockRecommendation['overallRating']): string => {
    switch (rating) {
      case 'strong_buy': return 'var(--accent-green)';
      case 'buy': return '#7ee787';
      case 'hold': return 'var(--accent-yellow)';
      case 'avoid': return 'var(--accent-red)';
    }
  };

  const getRatingLabel = (rating: StockRecommendation['overallRating']): string => {
    switch (rating) {
      case 'strong_buy': return 'STRONG BUY';
      case 'buy': return 'BUY';
      case 'hold': return 'HOLD';
      case 'avoid': return 'AVOID';
    }
  };

  const getImpactColor = (impact: 'supports' | 'neutral' | 'concerns'): string => {
    switch (impact) {
      case 'supports': return 'var(--accent-green)';
      case 'neutral': return 'var(--text-secondary)';
      case 'concerns': return 'var(--accent-red)';
    }
  };

  return (
    <div className="recommendations-panel">
      <div className="panel-header">
        <span>Investment Recommendations</span>
      </div>

      <form onSubmit={handleSubmit} className="recommendation-form">
        <div className="form-row">
          <div className="form-group">
            <label>Target Profit (%)</label>
            <input
              type="number"
              min="1"
              max="100"
              value={targetProfit}
              onChange={e => setTargetProfit(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Risk Tolerance (%)</label>
            <input
              type="number"
              min="1"
              max="50"
              value={riskTolerance}
              onChange={e => setRiskTolerance(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Exit Date</label>
            <input
              type="date"
              value={exitDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setExitDate(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Analyzing...' : 'Find Stocks'}
          </button>
        </div>
      </form>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className="recommendations-result">
          <div className="market-context">
            <div className="context-badge" data-condition={result.marketContext.condition}>
              Market: {result.marketContext.condition.toUpperCase()}
            </div>
            <div className="context-badge" data-volatility={result.marketContext.volatilityLevel}>
              Volatility: {result.marketContext.volatilityLevel.toUpperCase()}
            </div>
          </div>
          <p className="context-note">{result.marketContext.note}</p>

          <div className="recommendations-list">
            {result.recommendations.map(rec => (
              <div
                key={rec.symbol}
                className={`recommendation-card ${expandedStock === rec.symbol ? 'expanded' : ''}`}
              >
                <div
                  className="recommendation-header"
                  onClick={() => setExpandedStock(expandedStock === rec.symbol ? null : rec.symbol)}
                >
                  <div className="rec-main">
                    <span className="rec-symbol">{rec.symbol}</span>
                    <span className="rec-name">{rec.name}</span>
                  </div>
                  <div className="rec-scores">
                    <span
                      className="rec-rating"
                      style={{ background: getRatingColor(rec.overallRating) }}
                    >
                      {getRatingLabel(rec.overallRating)}
                    </span>
                    <span className="rec-probability">
                      {rec.probabilityScore}% probability
                    </span>
                  </div>
                </div>

                <div className="recommendation-summary">
                  <p>{rec.summary}</p>
                </div>

                {expandedStock === rec.symbol && (
                  <div className="recommendation-details">
                    <div className="detail-section">
                      <h4>Scenarios</h4>
                      <div className="scenarios">
                        {rec.scenarios.map(scenario => (
                          <div key={scenario.scenario} className="scenario">
                            <span className="scenario-name">{scenario.scenario}</span>
                            <span className={`scenario-return ${scenario.expectedReturn >= 0 ? 'positive' : 'negative'}`}>
                              {scenario.expectedReturn >= 0 ? '+' : ''}{scenario.expectedReturn.toFixed(1)}%
                            </span>
                            <span className="scenario-prob">{scenario.probability}% chance</span>
                            <span className="scenario-target">${scenario.priceTarget.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="detail-section">
                      <h4>Analysis Factors</h4>
                      <div className="factors-list">
                        {rec.factors.map((factor, i) => (
                          <div key={i} className="factor-item">
                            <div className="factor-header">
                              <span
                                className="factor-impact"
                                style={{ color: getImpactColor(factor.impact) }}
                              >
                                {factor.impact === 'supports' ? '✓' : factor.impact === 'concerns' ? '!' : '•'}
                              </span>
                              <span className="factor-name">{factor.name}</span>
                            </div>
                            <p className="factor-explanation">{factor.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="detail-row">
                      <div className="detail-section half">
                        <h4>Potential Catalysts</h4>
                        <ul className="catalyst-list">
                          {rec.catalysts.map((catalyst, i) => (
                            <li key={i}>{catalyst}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="detail-section half">
                        <h4>Key Risks</h4>
                        <ul className="risk-list">
                          {rec.risks.map((risk, i) => (
                            <li key={i}>{risk}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="detail-metrics">
                      <div className="metric">
                        <span className="metric-label">Expected Return</span>
                        <span className={`metric-value ${rec.expectedReturn >= 0 ? 'positive' : 'negative'}`}>
                          {rec.expectedReturn >= 0 ? '+' : ''}{rec.expectedReturn.toFixed(1)}%
                        </span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Max Drawdown</span>
                        <span className="metric-value negative">-{rec.maxDrawdown.toFixed(1)}%</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Risk Score</span>
                        <span className="metric-value">{rec.riskScore}/100</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Timeframe</span>
                        <span className="metric-value">{rec.daysToTarget} days ({rec.timeframeRating})</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="disclaimer">{result.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
