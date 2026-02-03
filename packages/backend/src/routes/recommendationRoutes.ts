import { Router } from 'express';
import { getRecommendations } from '../controllers/recommendationController.js';

const router = Router();

/**
 * GET /api/recommendations
 * Get stock recommendations based on investment criteria
 * Query params:
 *   - targetProfit: number (1-100, percentage)
 *   - riskTolerance: number (1-50, percentage)
 *   - exitDate: string (ISO date, must be in future)
 *   - investmentAmount: number (optional)
 */
router.get('/', getRecommendations);

export { router as recommendationRoutes };
