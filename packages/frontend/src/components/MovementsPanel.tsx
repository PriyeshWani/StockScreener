import { useMovements } from '../hooks/useMovements';
import { useStockAnalysis } from '../hooks/useStocks';

interface MovementsPanelProps {
  selectedSymbol: string | null;
}

export function MovementsPanel({ selectedSymbol }: MovementsPanelProps) {
  const { movements, loading: movementsLoading, error: movementsError } = useMovements();
  const { analysis, loading: analysisLoading } = useStockAnalysis(selectedSymbol);

  const getConfidenceClass = (confidence: number): string => {
    if (confidence >= 70) return 'high';
    if (confidence >= 50) return 'medium';
    return 'low';
  };

  const getDirectionBadge = (direction: 'up' | 'down' | 'sideways'): string => {
    if (direction === 'up') return 'bullish';
    if (direction === 'down') return 'bearish';
    return 'neutral';
  };

  return (
    <aside className="panel movements-panel">
      {selectedSymbol && (
        <div style={{ marginBottom: '2rem' }}>
          <div className="panel-header">
            <span>Analysis: {selectedSymbol}</span>
          </div>

          {analysisLoading ? (
            <div className="loading">Loading analysis...</div>
          ) : analysis ? (
            <div className="movement-card">
              <div className="movement-header">
                <span className={`badge badge-${getDirectionBadge(analysis.direction)}`}>
                  {analysis.momentum.toUpperCase()}
                </span>
                <span className="movement-meta">
                  Strength: {analysis.strength.toFixed(0)}%
                </span>
              </div>

              <div className="movement-meta" style={{ marginBottom: '0.5rem' }}>
                <strong>Technical Indicators</strong>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                RSI: {analysis.technical.rsi.toFixed(1)} |
                MACD: {analysis.technical.macd.histogram.toFixed(2)}
              </div>

              <div className="movement-meta" style={{ marginBottom: '0.5rem' }}>
                <strong>Sentiment Score</strong>
              </div>
              <div className="confidence-bar" style={{ marginBottom: '0.5rem' }}>
                <div
                  className={`confidence-fill ${getConfidenceClass((analysis.sentiment.overall + 1) * 50)}`}
                  style={{ width: `${(analysis.sentiment.overall + 1) * 50}%` }}
                />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                News: {analysis.sentiment.news.toFixed(2)} | Social: {analysis.sentiment.social.toFixed(2)}
              </div>

              {analysis.signals.length > 0 && (
                <>
                  <div className="movement-meta" style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
                    <strong>Key Signals</strong>
                  </div>
                  <div className="movement-factors">
                    {analysis.signals.slice(0, 4).map((signal, i) => (
                      <span
                        key={i}
                        className="factor-tag"
                        style={{
                          borderLeft: `2px solid ${
                            signal.type === 'bullish' ? 'var(--accent-green)' :
                            signal.type === 'bearish' ? 'var(--accent-red)' :
                            'var(--text-secondary)'
                          }`
                        }}
                      >
                        {signal.indicator}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>
      )}

      <div className="panel-header">
        <span>Potential Movements</span>
      </div>

      {movementsLoading ? (
        <div className="loading">Loading movements...</div>
      ) : movementsError ? (
        <div className="error">{movementsError}</div>
      ) : (
        movements.map(movement => (
          <div key={movement.symbol} className="movement-card">
            <div className="movement-header">
              <span className="movement-symbol">{movement.symbol}</span>
              <span className={`movement-direction ${movement.predictedDirection}`}>
                {movement.predictedDirection === 'up' ? '↑' : '↓'}
                {movement.expectedMovePercent >= 0 ? '+' : ''}{movement.expectedMovePercent.toFixed(1)}%
              </span>
            </div>

            <div className="movement-meta">
              {movement.name} | {movement.timeHorizon} term
            </div>

            <div className="movement-meta" style={{ marginTop: '0.5rem' }}>
              Confidence: {movement.confidence}%
            </div>
            <div className="confidence-bar">
              <div
                className={`confidence-fill ${getConfidenceClass(movement.confidence)}`}
                style={{ width: `${movement.confidence}%` }}
              />
            </div>

            <div className="movement-factors">
              {movement.factors.slice(0, 3).map((factor, i) => (
                <span
                  key={i}
                  className="factor-tag"
                  style={{
                    borderLeft: `2px solid ${
                      factor.impact === 'positive' ? 'var(--accent-green)' :
                      factor.impact === 'negative' ? 'var(--accent-red)' :
                      'var(--text-secondary)'
                    }`
                  }}
                >
                  {factor.name}
                </span>
              ))}
            </div>

            {movement.catalysts.length > 0 && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                Catalysts: {movement.catalysts.slice(0, 2).join(', ')}
              </div>
            )}
          </div>
        ))
      )}

      {!movementsLoading && movements.length === 0 && (
        <div className="loading">No potential movements detected</div>
      )}
    </aside>
  );
}
