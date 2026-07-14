import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@beten-homes-rent/shared';

const router = Router();
const controller = new ReportController();

router.use(authenticate);

router.get('/income', authorize(UserRole.OWNER, UserRole.MANAGER, UserRole.ACCOUNTANT), controller.getIncomeReport);
router.get('/expenses', authorize(UserRole.OWNER, UserRole.MANAGER, UserRole.ACCOUNTANT), controller.getExpenseReport);
router.get('/occupancy', authorize(UserRole.OWNER, UserRole.MANAGER), controller.getOccupancyReport);
router.get('/export/payments', authorize(UserRole.OWNER, UserRole.ACCOUNTANT), controller.exportPaymentsPDF);
router.get('/export/expenses', authorize(UserRole.OWNER, UserRole.ACCOUNTANT), controller.exportExpensesPDF);

export default router;
