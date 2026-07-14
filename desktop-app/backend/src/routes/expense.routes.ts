import { Router } from 'express';
import { ExpenseController } from '../controllers/expense.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { auditLog } from '../middleware/audit';
import { expenseSchema } from '../schemas';
import { UserRole, AuditAction } from '@beten-homes-rent/shared';

const router = Router();
const controller = new ExpenseController();

router.use(authenticate);

router.get('/', controller.findAll);
router.get('/:id', controller.findById);
router.post('/', authorize(UserRole.OWNER, UserRole.MANAGER, UserRole.ACCOUNTANT), validate(expenseSchema), auditLog(AuditAction.CREATE, 'Expense'), controller.create);
router.put('/:id', authorize(UserRole.OWNER, UserRole.MANAGER, UserRole.ACCOUNTANT), validate(expenseSchema), auditLog(AuditAction.UPDATE, 'Expense'), controller.update);
router.delete('/:id', authorize(UserRole.OWNER), auditLog(AuditAction.DELETE, 'Expense'), controller.delete);

export default router;
