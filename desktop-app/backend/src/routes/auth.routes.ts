import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  updateProfileSchema,
  changeEmailSchema,
  forgotPasswordSchema,
} from '../schemas';

const router = Router();
const controller = new AuthController();

router.post('/register', validate(registerSchema), controller.register);
router.post('/login', validate(loginSchema), controller.login);
router.post('/refresh-token', controller.refreshToken);
router.post('/forgot-password', validate(forgotPasswordSchema), controller.sendPasswordReset);
router.post('/sync-firebase-user', controller.syncFirebaseUser);
router.get('/profile', authenticate, controller.getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), controller.updateProfile);
router.put(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  controller.changePassword
);
router.put('/change-email', authenticate, validate(changeEmailSchema), controller.changeEmail);
router.post('/verify-email', authenticate, controller.sendEmailVerification);
router.delete('/account', authenticate, controller.deleteAccount);

export default router;
