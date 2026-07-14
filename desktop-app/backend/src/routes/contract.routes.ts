import { Router } from 'express';
import { ContractController } from '../controllers/contract.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { auditLog } from '../middleware/audit';
import { contractSchema } from '../schemas';
import { UserRole, AuditAction } from '@beten-homes-rent/shared';

const router = Router();
const controller = new ContractController();

router.use(authenticate);

router.get('/', controller.findAll);
router.get('/:id', controller.findById);
router.post(
  '/',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate(contractSchema),
  auditLog(AuditAction.CREATE, 'Contract'),
  controller.create
);
router.put(
  '/:id/terminate',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  auditLog(AuditAction.UPDATE, 'Contract'),
  controller.terminate
);

export default router;
