# Stock Screener

A full-stack stock screening web application with trend analysis and movement predictions.

## Project Structure

```
stock-screener/
├── packages/
│   ├── backend/          # Express.js API server
│   │   ├── src/
│   │   │   ├── routes/       # API route definitions
│   │   │   ├── controllers/  # Request handlers
│   │   │   ├── services/     # Business logic
│   │   │   ├── jobs/         # Background job processing
│   │   │   ├── analysis/     # Analysis modules
│   │   │   ├── types/        # TypeScript interfaces
│   │   │   ├── middleware/   # Express middleware
│   │   │   └── data/         # Mock data
│   │   └── package.json
│   │
│   └── frontend/         # React + Vite application
│       ├── src/
│       │   ├── components/   # React components
│       │   ├── hooks/        # Custom React hooks
│       │   ├── services/     # API client services
│       │   ├── types/        # TypeScript interfaces
│       │   ├── pages/        # Page components
│       │   └── utils/        # Utility functions
│       └── package.json
│
├── package.json          # Root workspace configuration
├── tsconfig.base.json    # Shared TypeScript config
└── .env.example          # Environment variables template
```

## Features

- **Stock Screener**: Filter and browse stocks by various criteria
- **Trend Analysis**: View trend indicators and momentum analysis
- **Movement Predictions**: See stocks with predicted movement potential
- **Background Processing**: Automated analysis of stocks using multiple data sources

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

## Getting Started

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd stock-screener

# Install dependencies
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example packages/backend/.env

# Edit with your configuration
# For development, defaults work out of the box
```

### 3. Run Development Servers

```bash
# Start both frontend and backend
npm run dev

# Or run separately:
npm run dev:backend   # Starts backend on http://localhost:3001
npm run dev:frontend  # Starts frontend on http://localhost:5173
```

### 4. Build for Production

```bash
npm run build
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stocks` | List stocks with optional filters |
| GET | `/api/stocks/:symbol` | Get detailed stock information |
| GET | `/api/stocks/:symbol/analysis` | Get trend analysis for a stock |
| GET | `/api/movements` | Get potential stock movements |
| GET | `/api/screener` | Run screener with custom filters |

### Query Parameters

**GET /api/stocks**
- `sector` - Filter by sector (e.g., Technology, Healthcare)
- `marketCap` - Filter by market cap (small, mid, large, mega)
- `minPrice` / `maxPrice` - Price range filter
- `minChange` / `maxChange` - Change percentage filter
- `sortBy` - Sort field (price, change, volume, marketCap)
- `sortOrder` - Sort direction (asc, desc)
- `limit` - Number of results (default: 50)
- `offset` - Pagination offset

**GET /api/screener**
- `momentum` - Momentum filter (bullish, bearish, neutral)
- `trend` - Trend direction (up, down, sideways)
- `sentiment` - Sentiment score range (e.g., 0.5-1.0)
- All filters from `/api/stocks` also apply

## Technology Stack

### Backend
- Node.js + Express.js
- TypeScript
- Background job processing system
- Modular analysis architecture

### Frontend
- React 18 + TypeScript
- Vite build tool
- Tailwind CSS
- React Query for data fetching

## Future Enhancements

- Real-time stock data integration (Alpha Vantage, Finnhub)
- News sentiment analysis
- Earnings calendar integration
- User watchlists and alerts
- Historical data charts
- PostgreSQL database integration
- Redis job queue

## License

MIT
