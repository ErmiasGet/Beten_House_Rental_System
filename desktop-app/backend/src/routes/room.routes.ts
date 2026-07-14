import { Router } from 'express';
import { RoomController } from '../controllers/room.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { auditLog } from '../middleware/audit';
import { roomSchema } from '../schemas';
import { UserRole, AuditAction } from '@beten-homes-rent/shared';

const router = Router();
const controller = new RoomController();

router.use(authenticate);

router.get('/vacant', controller.getVacant);
router.get('/', controller.findAll);
router.get('/:id', controller.findById);
router.post('/', authorize(UserRole.OWNER, UserRole.MANAGER), validate(roomSchema), auditLog(AuditAction.CREATE, 'Room'), controller.create);
router.put('/:id', authorize(UserRole.OWNER, UserRole.MANAGER), validate(roomSchema), auditLog(AuditAction.UPDATE, 'Room'), controller.update);
router.delete('/:id', authorize(UserRole.OWNER), auditLog(AuditAction.DELETE, 'Room'), controller.delete);

export default router;
