import { Router } from 'express';
import { analysisController } from '../controllers/analysisController.js';

const router = Router();

// Screener routes
router.get('/', analysisController.runScreener);

export { router as screenerRoutes };
