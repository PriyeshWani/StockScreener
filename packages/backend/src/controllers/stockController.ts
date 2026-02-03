import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { stockService } from '../services/stockService.js';
import { NotFoundError } from '../middleware/errorHandler.js';

// Validation schemas
const stockFiltersSchema = z.object({
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
  maxVolume: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  exchange: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['price', 'change', 'changePercent', 'volume', 'marketCap', 'name', 'symbol']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
});

export class StockController {
  /**
   * GET /api/stocks
   * Get paginated list of stocks with optional filtering
   */
  getStocks = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const filters = stockFiltersSchema.parse(req.query);
      const result = stockService.getStocks(filters);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/stocks/:symbol
   * Get detailed stock information by symbol
   */
  getStock = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { symbol } = req.params;

      if (!symbol) {
        throw new NotFoundError('Stock symbol required');
      }

      const stock = stockService.getStock(symbol);

      if (!stock) {
        throw new NotFoundError(`Stock with symbol ${symbol.toUpperCase()}`);
      }

      res.json({
        success: true,
        data: stock,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/stocks/meta/sectors
   * Get list of all sectors
   */
  getSectors = (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const sectors = stockService.getSectors();

      res.json({
        success: true,
        data: sectors,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/stocks/meta/exchanges
   * Get list of all exchanges
   */
  getExchanges = (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const exchanges = stockService.getExchanges();

      res.json({
        success: true,
        data: exchanges,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const stockController = new StockController();
