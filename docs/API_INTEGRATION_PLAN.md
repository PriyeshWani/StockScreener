# Stock Screener - Real Market Data Integration Plan

## Executive Summary

This document outlines a comprehensive plan to integrate real market data into the stock screener application, replacing the current dummy data. The plan covers API selection, data architecture, caching strategies, and implementation phases.

**Key Recommendation**: Use a multi-provider strategy with **Finnhub** as the primary free-tier provider for development, **Alpha Vantage** for fundamentals and technical indicators, and **Polygon.io** for production real-time data when scaling.

---

## 1. Real-Time Market Data APIs

### 1.1 Primary Recommendation: Finnhub

**Why Finnhub First**: Most generous free tier (60 calls/minute), excellent for development and MVP.

| Aspect | Details |
|--------|---------|
| **Free Tier** | 60 API calls/minute, WebSocket support |
| **Paid Plans** | Custom pricing based on usage |
| **Data Coverage** | US stocks, global markets, forex, crypto |
| **Latency** | Real-time via WebSocket, 15-min delay on REST (free) |
| **Best For** | Development, prototyping, MVPs |

**Key Endpoints Needed**:
```
GET /quote?symbol={symbol}           # Real-time quote
GET /stock/profile2?symbol={symbol}  # Company profile
GET /stock/metric?symbol={symbol}    # Financial metrics (P/E, EPS, etc.)
GET /stock/candle                    # Historical OHLCV data
WS  /ws/trade                        # Real-time trades (WebSocket)
```

**Pros**:
- Most generous free tier in the industry
- WebSocket support for real-time updates
- Good fundamental data coverage
- Active development and documentation

**Cons**:
- Limited historical data on free tier
- Some advanced metrics require paid plans
- International coverage varies

---

### 1.2 Secondary Recommendation: Alpha Vantage

**Why Alpha Vantage**: NASDAQ-licensed, excellent for technical indicators and fundamentals.

| Aspect | Details |
|--------|---------|
| **Free Tier** | 25 requests/day, 5 requests/minute |
| **Paid Plans** | $49.99/month (75 req/min), scales to $249.99/month |
| **Data Coverage** | 200,000+ tickers, 20+ global exchanges |
| **Latency** | Real-time requires premium subscription |
| **Best For** | Technical analysis, fundamentals, bulk historical data |

**Key Endpoints Needed**:
```
GET /query?function=GLOBAL_QUOTE&symbol={symbol}     # Current price
GET /query?function=OVERVIEW&symbol={symbol}         # Company fundamentals
GET /query?function=TIME_SERIES_DAILY&symbol={symbol} # Historical prices
GET /query?function=RSI&symbol={symbol}              # RSI indicator
GET /query?function=MACD&symbol={symbol}             # MACD indicator
GET /query?function=BBANDS&symbol={symbol}           # Bollinger Bands
GET /query?function=SMA&symbol={symbol}              # Moving averages
```

**Pros**:
- NASDAQ-licensed data provider (reliable data)
- 50+ built-in technical indicators
- 20+ years of historical data
- Excellent documentation

**Cons**:
- Very limited free tier (25/day is restrictive)
- Real-time data requires premium
- No WebSocket support

---

### 1.3 Production Recommendation: Polygon.io

**Why Polygon.io for Production**: Low-latency WebSocket infrastructure, ideal for real-time applications.

| Aspect | Details |
|--------|---------|
| **Free Tier** | 5 requests/minute (very limited) |
| **Paid Plans** | $79/month (Stocks Developer), $199/month (real-time), $499/month (advanced) |
| **Data Coverage** | All US exchanges, 15-20 years history |
| **Latency** | Sub-millisecond WebSocket feeds |
| **Best For** | Production real-time applications, algorithmic trading |

**Key Endpoints Needed**:
```
GET /v2/aggs/ticker/{ticker}/prev          # Previous day data
GET /v2/aggs/ticker/{ticker}/range/{mult}/{span}/{from}/{to}  # Historical bars
GET /v3/reference/tickers/{ticker}         # Ticker details
GET /v2/snapshot/locale/us/markets/stocks/tickers  # Market snapshot
WS  wss://socket.polygon.io/stocks         # Real-time trades
```

**Pros**:
- Institutional-grade infrastructure
- Tick-level data available
- Excellent WebSocket implementation
- Comprehensive market data (NBBO, trades, quotes)

**Cons**:
- Expensive for small projects
- Free tier barely usable
- Overkill for simple applications

---

### 1.4 Backup Option: Financial Modeling Prep (FMP)

| Aspect | Details |
|--------|---------|
| **Free Tier** | 250 requests/day |
| **Paid Plans** | $19/month (unlimited real-time) |
| **Data Coverage** | US and international, 30+ years fundamentals |
| **Best For** | Budget-conscious production apps |

**Why Consider FMP**:
- Most affordable paid option ($19/month for unlimited)
- 30+ years of fundamental data
- Good documentation and MCP server support

---

### 1.5 Important Note: IEX Cloud

**WARNING**: IEX Cloud discontinued all products on August 31, 2024. Do not use this provider.

---

### 1.6 Yahoo Finance (yfinance) - Use with Caution

| Aspect | Details |
|--------|---------|
| **Cost** | Free (unofficial) |
| **Reliability** | Unstable - frequent rate limiting and breakages |
| **Best For** | Personal projects, research only |

**Cons**:
- Unofficial API - can break without notice
- Aggressive rate limiting (429 errors common)
- Not suitable for production applications
- No commercial licensing

**Recommendation**: Use only as a fallback for non-critical data or personal development.

---

## 2. Macro Economic News Data

### 2.1 Primary: FRED API (Federal Reserve Economic Data)

| Aspect | Details |
|--------|---------|
| **Cost** | Free with API key |
| **Coverage** | 300+ economic indicators, FOMC data |
| **Update Frequency** | Varies by series (daily to monthly) |

**Key Series IDs**:
```
FEDFUNDS          # Federal Funds Rate
DGS10             # 10-Year Treasury Rate
UNRATE            # Unemployment Rate
CPIAUCSL          # Consumer Price Index
GDP               # Gross Domestic Product
UMCSENT           # Consumer Sentiment
T10Y2Y            # 10Y-2Y Treasury Spread (yield curve)
VIXCLS            # VIX Volatility Index
```

**Key Endpoints**:
```
GET /series/observations?series_id={id}  # Get data series
GET /releases                             # Get all releases
GET /releases/dates                       # Upcoming release dates
```

**Pros**:
- Official Federal Reserve data
- Completely free
- Comprehensive economic indicators
- Python library available (fredapi)

**Cons**:
- US-focused data only
- Some series have significant lag
- No real-time market news

---

### 2.2 Secondary: Finnhub Economic Calendar

Included in Finnhub subscription - provides:
- Economic calendar events
- FOMC meeting dates
- Economic indicator releases

```
GET /calendar/economic  # Economic events calendar
```

---

### 2.3 Alternative: Alpha Vantage Economic Indicators

```
GET /query?function=REAL_GDP
GET /query?function=INFLATION
GET /query?function=FEDERAL_FUNDS_RATE
GET /query?function=CPI
GET /query?function=UNEMPLOYMENT
```

---

## 3. Earnings Reports APIs

### 3.1 Primary: Finnhub Earnings Calendar

| Aspect | Details |
|--------|---------|
| **Cost** | Included in free tier |
| **Data** | EPS estimates, actuals, surprises |
| **Coverage** | US stocks |

**Key Endpoints**:
```
GET /calendar/earnings?from={date}&to={date}  # Earnings calendar
GET /stock/earnings?symbol={symbol}            # Company earnings history
GET /stock/earnings-quality-score?symbol={symbol}  # Earnings quality
```

---

### 3.2 Secondary: Alpha Vantage Earnings

```
GET /query?function=EARNINGS_CALENDAR&horizon=3month  # Upcoming earnings
GET /query?function=EARNINGS&symbol={symbol}          # Historical earnings
```

---

### 3.3 Production: Benzinga Earnings (via Polygon Partnership)

| Aspect | Details |
|--------|---------|
| **Cost** | Included with Polygon subscription |
| **Data** | Comprehensive earnings data with estimates |
| **Features** | Confirmed vs projected dates, EPS/revenue surprises |

**Endpoint**:
```
GET /v1/benzinga/earnings?ticker={ticker}
```

---

## 4. Company-Specific News APIs

### 4.1 Primary: Finnhub News

| Aspect | Details |
|--------|---------|
| **Cost** | Free tier included |
| **Features** | News by ticker, market news, WebSocket newsfeed |

**Key Endpoints**:
```
GET /company-news?symbol={symbol}&from={date}&to={date}  # Company news
GET /news?category=general                                 # Market news
WS  /ws/news                                              # Real-time news
```

---

### 4.2 Secondary: Benzinga News

| Aspect | Details |
|--------|---------|
| **Cost** | Subscription required (available via Polygon) |
| **Features** | Full article content, real-time, ticker filtering |

**Best For**: Production applications needing full article content.

**Endpoint**:
```
GET /api/v2/news?tickers={ticker}&displayOutput=full
```

---

### 4.3 Alternative: Alpha Vantage News Sentiment

| Aspect | Details |
|--------|---------|
| **Cost** | Premium required |
| **Features** | News with sentiment scores |

```
GET /query?function=NEWS_SENTIMENT&tickers={ticker}
```

**Returns**: Articles with sentiment scores (-1 to 1), relevance scores, and topic classifications.

---

## 5. API Selection Matrix

| Data Type | Development (Free) | Production (Paid) | Fallback |
|-----------|-------------------|-------------------|----------|
| **Real-time Quotes** | Finnhub | Polygon.io | FMP |
| **Fundamentals** | Alpha Vantage | Polygon.io | Finnhub |
| **Technical Indicators** | Alpha Vantage | Alpha Vantage | Calculate locally |
| **Historical Prices** | Finnhub | Polygon.io | Alpha Vantage |
| **Earnings Calendar** | Finnhub | Benzinga/Polygon | Alpha Vantage |
| **Company News** | Finnhub | Benzinga | Alpha Vantage |
| **Economic Data** | FRED | FRED | Alpha Vantage |
| **WebSocket Streaming** | Finnhub | Polygon.io | N/A |

---

## 6. Backend Integration Architecture

### 6.1 Proposed Architecture

```
                                    +------------------+
                                    |    Frontend      |
                                    |   (React/Vite)   |
                                    +--------+---------+
                                             |
                                             v
+------------------+              +----------+----------+
|   External APIs  |              |                     |
|  - Finnhub       +------------->+   Express Backend   |
|  - Alpha Vantage |              |                     |
|  - Polygon.io    |              +----+------+----+----+
|  - FRED          |                   |      |    |
+------------------+                   |      |    |
                                       v      v    v
                              +--------+--+ +-+----+----+ +----------+
                              |   Redis   | | TimescaleDB | |  Job     |
                              |   Cache   | | (Time-Series)| |  Queue   |
                              +-----------+ +-------------+ +----------+
```

### 6.2 Service Layer Structure

```
/packages/backend/src/
  /services/
    /providers/                    # API Provider Abstractions
      finnhubProvider.ts           # Finnhub API client
      alphaVantageProvider.ts      # Alpha Vantage API client
      polygonProvider.ts           # Polygon.io API client
      fredProvider.ts              # FRED API client
      providerRegistry.ts          # Provider selection logic

    /market/                       # Market Data Services
      quoteService.ts              # Real-time quotes
      historicalService.ts         # Historical price data
      fundamentalsService.ts       # Company fundamentals
      indicatorsService.ts         # Technical indicators

    /news/                         # News Services
      newsService.ts               # Company & market news
      earningsService.ts           # Earnings calendar
      economicService.ts           # Economic indicators

    /cache/                        # Caching Layer
      cacheService.ts              # Redis caching logic
      cacheKeys.ts                 # Key naming conventions
      ttlConfig.ts                 # TTL configurations

    /sync/                         # Data Synchronization
      syncScheduler.ts             # Scheduled data updates
      batchProcessor.ts            # Batch API requests
      rateLimiter.ts               # Rate limiting logic
```

### 6.3 Provider Abstraction Pattern

```typescript
// Example: Provider Interface
interface MarketDataProvider {
  name: string;
  priority: number;
  rateLimitPerMinute: number;

  getQuote(symbol: string): Promise<Quote>;
  getBatchQuotes(symbols: string[]): Promise<Quote[]>;
  getHistoricalPrices(symbol: string, range: DateRange): Promise<OHLCV[]>;
  getFundamentals(symbol: string): Promise<Fundamentals>;

  isHealthy(): Promise<boolean>;
  getRemainingQuota(): Promise<number>;
}

// Provider Registry with automatic failover
class ProviderRegistry {
  private providers: Map<string, MarketDataProvider>;

  async getQuote(symbol: string): Promise<Quote> {
    for (const provider of this.getSortedProviders()) {
      try {
        if (await provider.getRemainingQuota() > 0) {
          return await provider.getQuote(symbol);
        }
      } catch (error) {
        this.logError(provider.name, error);
        continue; // Failover to next provider
      }
    }
    throw new Error('All providers exhausted');
  }
}
```

---

## 7. Caching Strategy

### 7.1 Redis Cache Configuration

**Key Naming Convention**:
```
stock-screener:{service}:{dataType}:{identifier}:{params}

Examples:
stock-screener:quote:realtime:AAPL
stock-screener:fundamentals:overview:MSFT
stock-screener:news:company:GOOGL:2024-01-15
stock-screener:indicators:rsi:NVDA:14:daily
```

### 7.2 TTL Configuration by Data Type

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| **Real-time Quotes** | 15-30 seconds | Balance between freshness and API limits |
| **Intraday Prices** | 1 minute | Standard trading interval |
| **Daily Prices** | 1 hour (market hours) / 24 hours (closed) | Market-aware caching |
| **Fundamentals** | 24 hours | Changes quarterly |
| **Earnings Calendar** | 6 hours | Updates infrequently |
| **Company News** | 15 minutes | Fresh news matters |
| **Technical Indicators** | 5 minutes | Derived from price data |
| **Economic Indicators** | 1 hour | Updates on schedule |
| **Company Profile** | 7 days | Rarely changes |
| **Market Status** | 30 seconds | Important for trading hours |

### 7.3 Cache Implementation Pattern

```typescript
// TTL with jitter to prevent cache stampede
function getTTLWithJitter(baseTTL: number): number {
  const jitter = Math.floor(Math.random() * (baseTTL * 0.2)); // ±10%
  return baseTTL + jitter - (baseTTL * 0.1);
}

// Two-level caching (Local + Redis)
class CacheService {
  private localCache: Map<string, CacheEntry>;
  private redis: RedisClient;

  async get<T>(key: string): Promise<T | null> {
    // L1: Check local cache first
    const local = this.localCache.get(key);
    if (local && !local.isExpired()) {
      return local.value as T;
    }

    // L2: Check Redis
    const redis = await this.redis.get(key);
    if (redis) {
      // Populate L1 cache
      this.localCache.set(key, { value: redis, expiry: Date.now() + 60000 });
      return JSON.parse(redis) as T;
    }

    return null;
  }
}
```

### 7.4 Cache Invalidation Strategy

1. **Time-based expiration**: Primary mechanism via TTL
2. **Market-aware invalidation**: Longer TTL during market closed hours
3. **Event-driven invalidation**: Clear cache on significant events (earnings, splits)
4. **Pub/Sub invalidation**: Broadcast cache invalidation across instances

---

## 8. Database Schema (TimescaleDB)

### 8.1 Why TimescaleDB

- Built on PostgreSQL (full SQL support, joins, complex queries)
- Optimized for time-series data (hypertables, compression)
- Ideal for financial data that requires relational metadata
- Better for complex analytical queries than InfluxDB

### 8.2 Core Tables

```sql
-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Stocks master table
CREATE TABLE stocks (
    symbol VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    exchange VARCHAR(20) NOT NULL,
    sector VARCHAR(100),
    industry VARCHAR(100),
    market_cap_category VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time quotes (hypertable)
CREATE TABLE quotes (
    time TIMESTAMPTZ NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    price DECIMAL(12, 4) NOT NULL,
    open DECIMAL(12, 4),
    high DECIMAL(12, 4),
    low DECIMAL(12, 4),
    previous_close DECIMAL(12, 4),
    volume BIGINT,
    change DECIMAL(12, 4),
    change_percent DECIMAL(8, 4),
    FOREIGN KEY (symbol) REFERENCES stocks(symbol)
);
SELECT create_hypertable('quotes', 'time');

-- Historical OHLCV data (hypertable)
CREATE TABLE ohlcv_daily (
    time TIMESTAMPTZ NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    open DECIMAL(12, 4) NOT NULL,
    high DECIMAL(12, 4) NOT NULL,
    low DECIMAL(12, 4) NOT NULL,
    close DECIMAL(12, 4) NOT NULL,
    volume BIGINT NOT NULL,
    adjusted_close DECIMAL(12, 4),
    FOREIGN KEY (symbol) REFERENCES stocks(symbol)
);
SELECT create_hypertable('ohlcv_daily', 'time');

-- Fundamentals table
CREATE TABLE fundamentals (
    symbol VARCHAR(10) PRIMARY KEY,
    pe_ratio DECIMAL(10, 4),
    eps DECIMAL(10, 4),
    market_cap BIGINT,
    dividend_yield DECIMAL(8, 4),
    dividend_amount DECIMAL(10, 4),
    beta DECIMAL(6, 4),
    high_52_week DECIMAL(12, 4),
    low_52_week DECIMAL(12, 4),
    avg_volume BIGINT,
    shares_outstanding BIGINT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (symbol) REFERENCES stocks(symbol)
);

-- Earnings calendar
CREATE TABLE earnings (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    report_date DATE NOT NULL,
    fiscal_quarter VARCHAR(10),
    fiscal_year INTEGER,
    eps_estimate DECIMAL(10, 4),
    eps_actual DECIMAL(10, 4),
    revenue_estimate BIGINT,
    revenue_actual BIGINT,
    surprise_percent DECIMAL(8, 4),
    report_time VARCHAR(20), -- 'BMO', 'AMC', 'TNS'
    confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (symbol) REFERENCES stocks(symbol)
);
CREATE INDEX idx_earnings_date ON earnings(report_date);
CREATE INDEX idx_earnings_symbol ON earnings(symbol);

-- Company news
CREATE TABLE news (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10),
    headline VARCHAR(500) NOT NULL,
    summary TEXT,
    source VARCHAR(100),
    url VARCHAR(1000),
    published_at TIMESTAMPTZ NOT NULL,
    sentiment_score DECIMAL(4, 3), -- -1 to 1
    relevance_score DECIMAL(4, 3), -- 0 to 1
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (symbol) REFERENCES stocks(symbol)
);
SELECT create_hypertable('news', 'published_at');

-- Economic indicators
CREATE TABLE economic_indicators (
    time TIMESTAMPTZ NOT NULL,
    series_id VARCHAR(50) NOT NULL,
    value DECIMAL(20, 6) NOT NULL,
    PRIMARY KEY (time, series_id)
);
SELECT create_hypertable('economic_indicators', 'time');

-- Technical indicators cache
CREATE TABLE technical_indicators (
    time TIMESTAMPTZ NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    indicator VARCHAR(20) NOT NULL, -- 'RSI', 'MACD', 'SMA20', etc.
    value DECIMAL(20, 6) NOT NULL,
    params JSONB, -- {'period': 14} for RSI, etc.
    FOREIGN KEY (symbol) REFERENCES stocks(symbol)
);
SELECT create_hypertable('technical_indicators', 'time');

-- Data compression policy (compress data older than 7 days)
SELECT add_compression_policy('quotes', INTERVAL '7 days');
SELECT add_compression_policy('ohlcv_daily', INTERVAL '30 days');
SELECT add_compression_policy('news', INTERVAL '30 days');

-- Data retention policy (optional - delete data older than 2 years)
SELECT add_retention_policy('quotes', INTERVAL '2 years');
```

### 8.3 Useful Views

```sql
-- Latest quotes view
CREATE VIEW latest_quotes AS
SELECT DISTINCT ON (symbol) *
FROM quotes
ORDER BY symbol, time DESC;

-- Stock summary with fundamentals
CREATE VIEW stock_summary AS
SELECT
    s.symbol,
    s.name,
    s.sector,
    s.industry,
    q.price,
    q.change,
    q.change_percent,
    q.volume,
    f.pe_ratio,
    f.eps,
    f.market_cap,
    f.dividend_yield,
    f.beta
FROM stocks s
LEFT JOIN latest_quotes q ON s.symbol = q.symbol
LEFT JOIN fundamentals f ON s.symbol = f.symbol;
```

---

## 9. Update Frequency Strategy

### 9.1 Real-Time Updates (WebSocket)

| Data | Update Frequency | Source |
|------|------------------|--------|
| Stock Quotes | Real-time (streaming) | Finnhub/Polygon WebSocket |
| Market News | Real-time (streaming) | Finnhub WebSocket |

### 9.2 Scheduled Updates

| Data | Frequency | Timing | Source |
|------|-----------|--------|--------|
| Full Quote Refresh | Every 1 minute | Market hours only | Finnhub REST |
| Fundamentals | Daily | 6:00 AM ET | Alpha Vantage |
| Technical Indicators | Every 5 minutes | Market hours only | Calculated/Alpha Vantage |
| Earnings Calendar | Every 6 hours | All day | Finnhub |
| Company News | Every 15 minutes | All day | Finnhub |
| Economic Indicators | Every 4 hours | All day | FRED |
| Historical Prices | Daily | After market close | Finnhub/Polygon |

### 9.3 Job Queue Implementation

```typescript
// Using Bull queue for job scheduling
import Bull from 'bull';

const quotesQueue = new Bull('quotes', { redis: REDIS_URL });
const fundamentalsQueue = new Bull('fundamentals', { redis: REDIS_URL });
const indicatorsQueue = new Bull('indicators', { redis: REDIS_URL });

// Real-time quotes during market hours
quotesQueue.add('refresh-all', {}, {
  repeat: { cron: '*/1 9-16 * * 1-5' }, // Every minute, Mon-Fri, 9AM-4PM
  timezone: 'America/New_York'
});

// Daily fundamentals update
fundamentalsQueue.add('update-all', {}, {
  repeat: { cron: '0 6 * * *' }, // 6 AM daily
  timezone: 'America/New_York'
});

// Technical indicators during market hours
indicatorsQueue.add('calculate', {}, {
  repeat: { cron: '*/5 9-16 * * 1-5' }, // Every 5 min, Mon-Fri
  timezone: 'America/New_York'
});
```

---

## 10. Error Handling & Fallback Strategies

### 10.1 Error Categories

| Error Type | Strategy |
|------------|----------|
| Rate Limit (429) | Exponential backoff, switch provider |
| API Down (5xx) | Circuit breaker, failover to backup |
| Invalid Data | Log, skip, return cached data |
| Network Timeout | Retry with backoff, use cache |
| Authentication | Alert, refresh token, disable provider |

### 10.2 Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailure: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  private readonly threshold = 5;
  private readonly timeout = 60000; // 1 minute

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}
```

### 10.3 Fallback Chain

```typescript
async function getQuote(symbol: string): Promise<Quote> {
  // 1. Try cache first
  const cached = await cache.get(`quote:${symbol}`);
  if (cached && !isStale(cached)) return cached;

  // 2. Try primary provider (Finnhub)
  try {
    const quote = await finnhub.getQuote(symbol);
    await cache.set(`quote:${symbol}`, quote, TTL.QUOTE);
    return quote;
  } catch (e) {
    logger.warn('Finnhub failed, trying fallback', { symbol, error: e });
  }

  // 3. Try secondary provider (Alpha Vantage)
  try {
    const quote = await alphaVantage.getQuote(symbol);
    await cache.set(`quote:${symbol}`, quote, TTL.QUOTE);
    return quote;
  } catch (e) {
    logger.warn('Alpha Vantage failed', { symbol, error: e });
  }

  // 4. Return stale cache if available
  if (cached) {
    logger.warn('Returning stale cache', { symbol });
    return cached;
  }

  // 5. Throw error
  throw new Error(`Unable to fetch quote for ${symbol}`);
}
```

---

## 11. Implementation Phases

### Phase 1: Foundation (Week 1-2)

- [ ] Set up Redis cache infrastructure
- [ ] Implement Finnhub provider (primary free tier)
- [ ] Create provider abstraction layer
- [ ] Implement basic caching with TTL
- [ ] Replace mock data with real quotes for existing 30 stocks

**Deliverable**: Real quotes displaying in screener tab

### Phase 2: Fundamentals & News (Week 3-4)

- [ ] Implement Alpha Vantage provider (fundamentals)
- [ ] Add FRED API integration (economic data)
- [ ] Implement earnings calendar endpoint
- [ ] Add company news feed
- [ ] Set up scheduled jobs for data updates

**Deliverable**: Full stock details with fundamentals and news

### Phase 3: Technical Analysis (Week 5-6)

- [ ] Implement technical indicators (RSI, MACD, SMA, Bollinger Bands)
- [ ] Set up TimescaleDB for historical data
- [ ] Build historical price data pipeline
- [ ] Add technical indicator calculations
- [ ] Implement screener filters for technical signals

**Deliverable**: Screener with technical analysis filters

### Phase 4: Real-Time Features (Week 7-8)

- [ ] Implement WebSocket connections for real-time quotes
- [ ] Add real-time news feed
- [ ] Implement price alerts
- [ ] Add market status awareness (open/closed/pre-market)
- [ ] Performance optimization and load testing

**Deliverable**: Real-time data streaming to frontend

### Phase 5: Production Hardening (Week 9-10)

- [ ] Implement circuit breakers and failover
- [ ] Add comprehensive error handling
- [ ] Set up monitoring and alerting
- [ ] Implement rate limiting on API routes
- [ ] Documentation and testing

**Deliverable**: Production-ready backend

---

## 12. Cost Estimation

### Development Phase (Free Tier)

| Provider | Monthly Cost | Notes |
|----------|--------------|-------|
| Finnhub | $0 | 60 calls/min sufficient for dev |
| Alpha Vantage | $0 | 25/day limiting but manageable |
| FRED | $0 | Completely free |
| **Total** | **$0** | |

### Production Phase (Recommended)

| Provider | Monthly Cost | Notes |
|----------|--------------|-------|
| Finnhub (Paid) | ~$50-100 | Based on usage |
| Alpha Vantage | $49.99 | 75 calls/min |
| Polygon.io | $79-199 | If real-time needed |
| FRED | $0 | Always free |
| Redis Cloud | $0-30 | Free tier to starter |
| TimescaleDB Cloud | $0-29 | Free tier to starter |
| **Total** | **$100-400** | Depends on requirements |

### Budget-Conscious Alternative

| Provider | Monthly Cost | Notes |
|----------|--------------|-------|
| FMP | $19 | Unlimited real-time |
| FRED | $0 | Economic data |
| Redis Cloud | $0 | Free tier |
| **Total** | **$19** | Basic but functional |

---

## 13. Environment Variables

Add to `.env`:

```bash
# API Keys
FINNHUB_API_KEY=your_finnhub_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
POLYGON_API_KEY=your_polygon_key       # Optional, for production
FMP_API_KEY=your_fmp_key               # Optional, backup
FRED_API_KEY=your_fred_key

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/stock_screener
TIMESCALE_ENABLED=true

# Redis
REDIS_URL=redis://localhost:6379

# Cache TTLs (in seconds)
CACHE_TTL_QUOTE=30
CACHE_TTL_FUNDAMENTALS=86400
CACHE_TTL_NEWS=900
CACHE_TTL_INDICATORS=300

# Rate Limiting
RATE_LIMIT_FINNHUB=60
RATE_LIMIT_ALPHA_VANTAGE=5
RATE_LIMIT_POLYGON=100

# Feature Flags
ENABLE_WEBSOCKET=true
ENABLE_REAL_TIME=false    # Set true when ready for production
```

---

## 14. Monitoring & Observability

### Key Metrics to Track

1. **API Health**
   - Request success rate per provider
   - Average response time per provider
   - Rate limit utilization
   - Error rates by type

2. **Cache Performance**
   - Cache hit rate
   - Cache miss rate
   - Memory usage
   - Key expiration rate

3. **Data Quality**
   - Data freshness (age of cached data)
   - Missing data points
   - Data validation failures

4. **Business Metrics**
   - Active symbols tracked
   - API cost per request
   - User request patterns

---

## 15. Summary & Next Steps

### Recommended Initial Setup

1. **Primary Data Provider**: Finnhub (generous free tier, WebSocket support)
2. **Fundamentals & Indicators**: Alpha Vantage (NASDAQ-licensed, 50+ indicators)
3. **Economic Data**: FRED (free, official Fed data)
4. **Caching**: Redis with TTL-based expiration
5. **Database**: TimescaleDB for time-series data

### Immediate Actions

1. Sign up for API keys:
   - Finnhub: https://finnhub.io/
   - Alpha Vantage: https://www.alphavantage.co/support/#api-key
   - FRED: https://fred.stlouisfed.org/docs/api/api_key.html

2. Set up Redis (local or cloud)
3. Create provider abstraction layer
4. Implement Finnhub integration first
5. Replace mock data gradually

### Risk Mitigation

- Always have fallback providers configured
- Implement aggressive caching to reduce API dependency
- Monitor API quotas and costs closely
- Have circuit breakers for all external calls
- Keep mock data available for development/testing

---

## Appendix: API Quick Reference

### Finnhub Endpoints Used

| Endpoint | Purpose | Rate Limit |
|----------|---------|------------|
| `/quote` | Real-time quotes | 60/min (free) |
| `/stock/profile2` | Company info | 60/min |
| `/stock/metric` | Fundamentals | 60/min |
| `/company-news` | News by ticker | 60/min |
| `/calendar/earnings` | Earnings calendar | 60/min |
| WebSocket | Real-time streaming | Unlimited |

### Alpha Vantage Functions Used

| Function | Purpose | Rate Limit |
|----------|---------|------------|
| `GLOBAL_QUOTE` | Current price | 5/min, 25/day (free) |
| `OVERVIEW` | Company fundamentals | 5/min |
| `TIME_SERIES_DAILY` | Historical prices | 5/min |
| `RSI`, `MACD`, `SMA`, `EMA`, `BBANDS` | Technical indicators | 5/min |
| `EARNINGS_CALENDAR` | Earnings dates | 5/min |

### FRED Series IDs

| Series ID | Description | Frequency |
|-----------|-------------|-----------|
| `FEDFUNDS` | Fed Funds Rate | Daily |
| `DGS10` | 10-Year Treasury | Daily |
| `UNRATE` | Unemployment Rate | Monthly |
| `CPIAUCSL` | CPI | Monthly |
| `UMCSENT` | Consumer Sentiment | Monthly |
| `VIXCLS` | VIX Index | Daily |

---

*Document Version: 1.0*
*Last Updated: 2026-02-02*
*Author: Claude Code Assistant*
