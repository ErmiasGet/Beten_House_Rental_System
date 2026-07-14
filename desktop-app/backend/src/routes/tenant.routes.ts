import { Router } from 'express';
import { TenantController } from '../controllers/tenant.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { auditLog } from '../middleware/audit';
import { upload } from '../middleware/upload';
import { tenantSchema } from '../schemas';
import { UserRole, AuditAction } from '@beten-homes-rent/shared';

const router = Router();
const controller = new TenantController();

router.use(authenticate);

router.get('/', controller.findAll);
router.get('/:id', controller.findById);
router.post(
  '/',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  upload.single('contractImage'),
  validate(tenantSchema),
  auditLog(AuditAction.CREATE, 'Tenant'),
  controller.create
);
router.put(
  '/:id',
  authorize(UserRole.OWNER, UserRole.MANAGER),
  validate(tenantSchema),
  auditLog(AuditAction.UPDATE, 'Tenant'),
  controller.update
);
router.delete(
  '/:id',
  authorize(UserRole.OWNER),
  auditLog(AuditAction.DELETE, 'Tenant'),
  controller.delete
);

export default router;
