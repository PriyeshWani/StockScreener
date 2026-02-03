import { Router } from 'express';
import { stockController } from '../controllers/stockController.js';
import { analysisController } from '../controllers/analysisController.js';

const router = Router();

// Stock metadata routes (must come before parameterized routes)
router.get('/meta/sectors', stockController.getSectors);
router.get('/meta/exchanges', stockController.getExchanges);
router.get('/meta/status', stockController.getStatus);

// Stock list and detail routes
router.get('/', stockController.getStocks);
router.get('/:symbol', stockController.getStock);

// Stock analysis routes
router.get('/:symbol/analysis', analysisController.getAnalysis);
router.post('/:symbol/analysis/refresh', analysisController.refreshAnalysis);

export { router as stockRoutes };
