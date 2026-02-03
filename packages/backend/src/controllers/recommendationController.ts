import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { recommendationService } from '../services/recommendationService.js';

const recommendationQuerySchema = z.object({
  targetProfit: z.string().transform(Number).pipe(z.number().min(1).max(100)),
  riskTolerance: z.string().transform(Number).pipe(z.number().min(1).max(50)),
  exitDate: z.string().refine(
    (date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime()) && parsed > new Date();
    },
    { message: 'Exit date must be a valid future date' }
  ),
  investmentAmount: z.string().transform(Number).pipe(z.number().positive()).optional(),
});

export async function getRecommendations(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = recommendationQuerySchema.parse(req.query);

    const criteria = {
      targetProfitPercent: query.targetProfit,
      riskTolerancePercent: query.riskTolerance,
      exitDate: query.exitDate,
      investmentAmount: query.investmentAmount,
    };

    const result = recommendationService.generateRecommendations(criteria);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
