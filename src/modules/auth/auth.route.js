import { Router } from 'express';
import * as authController from './auth.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/profile', protect, authController.getProfile);

export default router;
