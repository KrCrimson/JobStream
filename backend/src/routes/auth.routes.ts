import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { validateLogin, validateRegister } from '../middleware/validation';

const router = Router();
const authController = new AuthController();

router.post('/register', authLimiter, validateRegister, authController.register.bind(authController));
router.post('/login', authLimiter, validateLogin, authController.login.bind(authController));
router.get('/profile', authenticate, authController.getProfile.bind(authController));
router.put('/profile', authenticate, authController.updateProfile.bind(authController));
router.post('/change-password', authenticate, authController.changePassword.bind(authController));

export default router;
