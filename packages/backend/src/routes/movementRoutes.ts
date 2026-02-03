import { Router } from 'express';
import { movementController } from '../controllers/movementController.js';

const router = Router();

// Movement routes
router.get('/', movementController.getMovements);
router.get('/:symbol', movementController.getMovement);

export { router as movementRoutes };
