import { Router } from 'express';
import * as authController from './auth.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = Router();

// Public routes
router.post('/register', authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-otp', authController.resendOtp);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/profile', protect, authController.getProfile);
router.put('/profile/images', protect, authController.updateProfileImages);
router.post('/logout', protect, authController.logout);
router.get('/my-menus', protect, authController.getMyMenus);

export default router;
