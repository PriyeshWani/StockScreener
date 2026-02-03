import { useState, useEffect } from 'react';
import { StockTable } from './components/StockTable';
import { FiltersPanel } from './components/FiltersPanel';
import { MovementsPanel } from './components/MovementsPanel';
import { RecommendationsPanel } from './components/RecommendationsPanel';
import { healthApi } from './services/api';
import type { ScreenerFilters } from './types';

type Tab = 'screener' | 'recommendations';

function App() {
  const [connected, setConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('screener');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [filters, setFilters] = useState<ScreenerFilters>({});

  useEffect(() => {
    healthApi.check().then(response => {
      setConnected(response.success);
    });
  }, []);

  const handleFilterChange = (newFilters: ScreenerFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1>Stock Screener</h1>
          <nav className="tabs">
            <button
              className={`tab ${activeTab === 'screener' ? 'active' : ''}`}
              onClick={() => setActiveTab('screener')}
            >
              Screener
            </button>
            <button
              className={`tab ${activeTab === 'recommendations' ? 'active' : ''}`}
              onClick={() => setActiveTab('recommendations')}
            >
              Investment Recommendations
            </button>
          </nav>
        </div>
        <div className="header-status">
          <span className="status-dot" style={{ background: connected ? '#3fb950' : '#f85149' }} />
          <span>{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </header>

      {activeTab === 'screener' ? (
        <main className="main-content">
          <FiltersPanel filters={filters} onFilterChange={handleFilterChange} />
          <StockTable
            filters={filters}
            selectedSymbol={selectedSymbol}
            onSelectStock={setSelectedSymbol}
          />
          <MovementsPanel selectedSymbol={selectedSymbol} />
        </main>
      ) : (
        <main className="main-content single-panel">
          <RecommendationsPanel />
        </main>
      )}
    </div>
  );
}

export default App;
