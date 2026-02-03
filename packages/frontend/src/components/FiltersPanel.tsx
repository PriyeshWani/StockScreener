import type { ScreenerFilters } from '../types';

const SECTORS = [
  'All Sectors',
  'Technology',
  'Healthcare',
  'Financial Services',
  'Consumer Cyclical',
  'Communication Services',
  'Industrials',
  'Consumer Defensive',
  'Energy',
  'Utilities',
  'Real Estate',
  'Basic Materials',
];

const MARKET_CAP_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Mega ($200B+)', value: '200000000000' },
  { label: 'Large ($10B-$200B)', value: '10000000000' },
  { label: 'Mid ($2B-$10B)', value: '2000000000' },
  { label: 'Small ($300M-$2B)', value: '300000000' },
];

interface FiltersPanelProps {
  filters: ScreenerFilters;
  onFilterChange: (filters: ScreenerFilters) => void;
}

export function FiltersPanel({ filters, onFilterChange }: FiltersPanelProps) {
  const handleSectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFilterChange({
      ...filters,
      sectors: value && value !== 'All Sectors' ? [value] : undefined,
    });
  };

  const handleMarketCapChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFilterChange({
      ...filters,
      minMarketCap: value ? parseInt(value) : undefined,
    });
  };

  const handleDirectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as 'up' | 'down' | 'sideways' | '';
    onFilterChange({
      ...filters,
      direction: value || undefined,
    });
  };

  const handlePriceChange = (field: 'minPrice' | 'maxPrice', value: string) => {
    onFilterChange({
      ...filters,
      [field]: value ? parseFloat(value) : undefined,
    });
  };

  const handleReset = () => {
    onFilterChange({});
  };

  return (
    <aside className="panel filters-panel">
      <div className="panel-header">
        <span>Filters</span>
        <button className="btn btn-secondary" onClick={handleReset}>
          Reset
        </button>
      </div>

      <div className="filter-group">
        <label>Sector</label>
        <select
          value={filters.sectors?.[0] ?? 'All Sectors'}
          onChange={handleSectorChange}
        >
          {SECTORS.map(sector => (
            <option key={sector} value={sector}>
              {sector}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Market Cap</label>
        <select
          value={filters.minMarketCap?.toString() ?? ''}
          onChange={handleMarketCapChange}
        >
          {MARKET_CAP_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Trend Direction</label>
        <select
          value={filters.direction ?? ''}
          onChange={handleDirectionChange}
        >
          <option value="">All</option>
          <option value="up">Bullish (Up)</option>
          <option value="down">Bearish (Down)</option>
          <option value="sideways">Neutral (Sideways)</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Min Price ($)</label>
        <input
          type="number"
          placeholder="0"
          value={filters.minPrice ?? ''}
          onChange={e => handlePriceChange('minPrice', e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label>Max Price ($)</label>
        <input
          type="number"
          placeholder="No limit"
          value={filters.maxPrice ?? ''}
          onChange={e => handlePriceChange('maxPrice', e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label>Sort By</label>
        <select
          value={filters.sortBy ?? ''}
          onChange={e => onFilterChange({ ...filters, sortBy: e.target.value || undefined })}
        >
          <option value="">Default</option>
          <option value="changePercent">% Change</option>
          <option value="volume">Volume</option>
          <option value="marketCap">Market Cap</option>
          <option value="price">Price</option>
        </select>
      </div>
    </aside>
  );
}
