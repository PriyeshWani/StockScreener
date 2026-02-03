import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { analysisService } from '../services/analysisService.js';
import { NotFoundError } from '../middleware/errorHandler.js';

// Validation schemas
const screenerFiltersSchema = z.object({
  // Stock filters
  sector: z.string().optional(),
  sectors: z.string().optional().transform(val => val?.split(',').filter(Boolean)),
  marketCap: z.enum(['small', 'mid', 'large', 'mega']).optional(),
  marketCaps: z.string().optional().transform(val =>
    val?.split(',').filter(Boolean) as ('small' | 'mid' | 'large' | 'mega')[] | undefined
  ),
  minPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  minChange: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxChange: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  minVolume: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),

  // Analysis filters
  momentum: z.enum(['bullish', 'bearish', 'neutral']).optional(),
  trend: z.enum(['up', 'down', 'sideways']).optional(),
  minSentiment: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxSentiment: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  minRsi: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxRsi: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  aboveSma20: z.string().optional().transform(val => val === 'true'),
  aboveSma50: z.string().optional().transform(val => val === 'true'),
  aboveSma200: z.string().optional().transform(val => val === 'true'),
  goldenCross: z.string().optional().transform(val => val === 'true'),
  deathCross: z.string().optional().transform(val => val === 'true'),

  // Pagination
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
});

export class AnalysisController {
  /**
   * GET /api/stocks/:symbol/analysis
   * Get trend analysis for a specific stock
   */
  getAnalysis = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { symbol } = req.params;

      if (!symbol) {
        throw new NotFoundError('Stock symbol required');
      }

      const analysis = analysisService.getAnalysis(symbol);

      if (!analysis) {
        throw new NotFoundError(`Analysis for stock ${symbol.toUpperCase()}`);
      }

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/stocks/:symbol/analysis/refresh
   * Refresh analysis for a specific stock
   */
  refreshAnalysis = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { symbol } = req.params;

      if (!symbol) {
        throw new NotFoundError('Stock symbol required');
      }

      const analysis = analysisService.refreshAnalysis(symbol);

      if (!analysis) {
        throw new NotFoundError(`Stock ${symbol.toUpperCase()}`);
      }

      res.json({
        success: true,
        data: analysis,
        message: 'Analysis refreshed successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/screener
   * Run screener with custom filters
   */
  runScreener = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const filters = screenerFiltersSchema.parse(req.query);
      const result = analysisService.runScreener(filters);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const analysisController = new AnalysisController();
