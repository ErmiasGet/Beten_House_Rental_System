import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new NotificationController();

router.use(authenticate);

router.get('/', controller.findAll);
router.put('/:id/read', controller.markAsRead);
router.put('/read-all', controller.markAllAsRead);
router.post('/push-token', controller.registerPushToken);
router.delete('/:id', controller.delete);

export default router;
