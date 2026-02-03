import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { apiRoutes } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/index.js';
import { jobQueue } from './jobs/JobQueue.js';
import {
  handleStockAnalysis,
  handleNewsSentiment,
  handleEarningsAnalysis,
  handleMacroAnalysis,
  handleMovementPrediction,
  handleBatchUpdate,
} from './jobs/handlers.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', apiRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Register job handlers
jobQueue.registerHandler('stock_analysis', handleStockAnalysis);
jobQueue.registerHandler('news_sentiment', handleNewsSentiment);
jobQueue.registerHandler('earnings_analysis', handleEarningsAnalysis);
jobQueue.registerHandler('macro_analysis', handleMacroAnalysis);
jobQueue.registerHandler('movement_prediction', handleMovementPrediction);
jobQueue.registerHandler('batch_update', handleBatchUpdate);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Stock Screener API running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);

  // Start background job processing
  jobQueue.start(2000);
  console.log('📋 Background job queue started');

  // Schedule initial batch update
  jobQueue.enqueue('batch_update', {
    updateTypes: ['prices', 'analysis'],
  }, { priority: 'low' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  jobQueue.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  jobQueue.stop();
  process.exit(0);
});
