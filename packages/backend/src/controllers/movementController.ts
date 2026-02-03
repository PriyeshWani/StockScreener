import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { movementService } from '../services/movementService.js';
import { NotFoundError } from '../middleware/errorHandler.js';

// Validation schemas
const movementFiltersSchema = z.object({
  direction: z.enum(['up', 'down']).optional(),
  minConfidence: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxConfidence: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  minExpectedMove: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxExpectedMove: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  timeHorizon: z.enum(['short', 'medium', 'long']).optional(),
  riskLevel: z.enum(['low', 'medium', 'high']).optional(),
  sector: z.string().optional(),
  sectors: z.string().optional().transform(val => val?.split(',').filter(Boolean)),
  sortBy: z.enum(['confidence', 'expectedMove', 'volatility', 'symbol']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
});

export class MovementController {
  /**
   * GET /api/movements
   * Get potential stock movements with optional filtering
   */
  getMovements = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const filters = movementFiltersSchema.parse(req.query);
      const result = movementService.getMovements(filters);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/movements/:symbol
   * Get movement prediction for a specific stock
   */
  getMovement = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { symbol } = req.params;

      if (!symbol) {
        throw new NotFoundError('Stock symbol required');
      }

      const movement = movementService.getMovement(symbol);

      if (!movement) {
        throw new NotFoundError(`Movement prediction for stock ${symbol.toUpperCase()}`);
      }

      res.json({
        success: true,
        data: movement,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const movementController = new MovementController();
