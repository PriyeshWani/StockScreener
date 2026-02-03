import { useEffect, useState } from 'react';
import type { Stock, ScreenerFilters } from '../types';
import { screenerApi, stockApi } from '../services/api';

interface StockTableProps {
  filters: ScreenerFilters;
  selectedSymbol: string | null;
  onSelectStock: (symbol: string | null) => void;
}

export function StockTable({ filters, selectedSymbol, onSelectStock }: StockTableProps) {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const hasFilters = Object.values(filters).some(v => v !== undefined);
      const response = hasFilters
        ? await screenerApi.run(filters)
        : await stockApi.getAll({ limit: 50 });

      if (response.success && response.data) {
        setStocks(response.data);
      } else {
        setError(response.error?.message ?? 'Failed to fetch stocks');
      }
      setLoading(false);
    };

    fetchData();
  }, [filters]);

  const formatNumber = (num: number): string => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const formatVolume = (vol: number): string => {
    if (vol >= 1e9) return `${(vol / 1e9).toFixed(1)}B`;
    if (vol >= 1e6) return `${(vol / 1e6).toFixed(1)}M`;
    if (vol >= 1e3) return `${(vol / 1e3).toFixed(1)}K`;
    return vol.toString();
  };

  if (loading) {
    return (
      <section className="panel">
        <div className="loading">Loading stocks...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel">
        <div className="error">{error}</div>
      </section>
    );
  }

  return (
    <section className="panel stock-table-panel">
      <table className="stock-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Price</th>
            <th>Change</th>
            <th>Volume</th>
            <th>Market Cap</th>
            <th>Sector</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map(stock => (
            <tr
              key={stock.symbol}
              className={selectedSymbol === stock.symbol ? 'selected' : ''}
              onClick={() => onSelectStock(
                selectedSymbol === stock.symbol ? null : stock.symbol
              )}
            >
              <td>
                <div className="stock-symbol">{stock.symbol}</div>
                <div className="stock-name">{stock.name}</div>
              </td>
              <td>${stock.price.toFixed(2)}</td>
              <td className={stock.change >= 0 ? 'price-positive' : 'price-negative'}>
                {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
              </td>
              <td>{formatVolume(stock.volume)}</td>
              <td>${formatNumber(stock.marketCap)}</td>
              <td>
                <span className="sector-tag">{stock.sector}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {stocks.length === 0 && (
        <div className="loading">No stocks match your filters</div>
      )}
    </section>
  );
}
