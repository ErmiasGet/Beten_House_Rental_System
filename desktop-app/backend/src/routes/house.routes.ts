import { Router } from 'express';
import { HouseController } from '../controllers/house.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { auditLog } from '../middleware/audit';
import { upload } from '../middleware/upload';
import { houseSchema } from '../schemas';
import { UserRole, AuditAction } from '@beten-homes-rent/shared';

const router = Router();
const controller = new HouseController();

router.use(authenticate);

router.get('/search', controller.search);
router.get('/', controller.findAll);
router.get('/:id', controller.findById);
router.post('/', authorize(UserRole.OWNER, UserRole.MANAGER), validate(houseSchema), upload.array('images', 10), auditLog(AuditAction.CREATE, 'House'), controller.create);
router.put('/:id', authorize(UserRole.OWNER, UserRole.MANAGER), validate(houseSchema), auditLog(AuditAction.UPDATE, 'House'), controller.update);
router.delete('/:id', authorize(UserRole.OWNER), auditLog(AuditAction.DELETE, 'House'), controller.delete);

export default router;
