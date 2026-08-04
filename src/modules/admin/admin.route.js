import express from 'express';
import { adminLogin, createMenu, getMenus, assignBaseRolePermissions } from './admin.controller.js';
import { protect, authorize } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Public route for admin login
router.post('/login', adminLogin);

// Protected Admin Routes
router.use(protect);
router.use(authorize('ADMIN'));

// Menus
router.post('/menu', createMenu);
router.get('/menu', getMenus);

// Base Roles Assignment
router.post('/role-permission', assignBaseRolePermissions);

export default router;
