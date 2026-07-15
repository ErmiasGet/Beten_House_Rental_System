import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { auditLog } from '../middleware/audit';
import { paymentSchema, paymentUpdateSchema, payOverdueSchema } from '../schemas';
import { UserRole, AuditAction } from '@beten-homes-rent/shared';

const router = Router();
const controller = new PaymentController();

router.use(authenticate);

router.get('/', controller.findAll);
router.get('/balance/:tenantId', controller.getTenantBalance);
router.get('/:id', controller.findById);
router.post(
  '/',
  authorize(UserRole.OWNER, UserRole.MANAGER, UserRole.ACCOUNTANT),
  validate(paymentSchema),
  auditLog(AuditAction.CREATE, 'Payment'),
  controller.create
);
router.post(
  '/pay-overdue',
  authorize(UserRole.OWNER, UserRole.MANAGER, UserRole.ACCOUNTANT),
  validate(payOverdueSchema),
  auditLog(AuditAction.UPDATE, 'Payment'),
  controller.payOverdue
);
router.put(
  '/:id',
  authorize(UserRole.OWNER, UserRole.MANAGER, UserRole.ACCOUNTANT),
  validate(paymentUpdateSchema),
  auditLog(AuditAction.UPDATE, 'Payment'),
  controller.update
);

export default router;
