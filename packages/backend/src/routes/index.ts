import { Router } from 'express';
import { stockRoutes } from './stockRoutes.js';
import { movementRoutes } from './movementRoutes.js';
import { screenerRoutes } from './screenerRoutes.js';
import { recommendationRoutes } from './recommendationRoutes.js';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Stock Screener API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use('/stocks', stockRoutes);
router.use('/movements', movementRoutes);
router.use('/screener', screenerRoutes);
router.use('/recommendations', recommendationRoutes);

export { router as apiRoutes };
