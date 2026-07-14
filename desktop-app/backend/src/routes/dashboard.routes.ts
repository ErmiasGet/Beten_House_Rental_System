import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new DashboardController();

router.get('/stats', authenticate, controller.getStats);

export default router;
