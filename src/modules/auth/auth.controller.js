import asyncHandler from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../core/ApiResponse.js';
import { registerSchema, loginSchema, verifyEmailSchema, resendOtpSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.validation.js';
import * as authService from './auth.service.js';
import { HTTP_STATUS } from '../../constants/index.js';
import prisma from '../../core/prisma.js';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * POST /api/v1/auth/register
 * Register a new user (Public)
 */
export const register = asyncHandler(async (req, res) => {
  const validatedData = registerSchema.parse(req.body);
  const result = await authService.registerUser(validatedData);

  res
    .status(HTTP_STATUS.CREATED)
    .json(
      new ApiResponse(
        HTTP_STATUS.CREATED,
        result,
        'User registration completed successfully.'
      )
    );
});

/**
 * POST /api/v1/auth/verify-email
 * Verify user's email using OTP (Public)
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const validatedData = verifyEmailSchema.parse(req.body);
  const result = await authService.verifyEmail(validatedData);

  res
    .status(HTTP_STATUS.OK)
    .cookie('token', result.token, cookieOptions)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        result,
        'Email verified successfully. You are now logged in.'
      )
    );
});

/**
 * POST /api/v1/auth/resend-otp
 * Resend OTP to user's email (Public)
 */
export const resendOtp = asyncHandler(async (req, res) => {
  const validatedData = resendOtpSchema.parse(req.body);
  await authService.resendOtp(validatedData);

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        null,
        'A new OTP has been sent to your email.'
      )
    );
});

/**
 * POST /api/v1/auth/login
 * Login with email & password (Public)
 */
export const login = asyncHandler(async (req, res) => {
  const validatedData = loginSchema.parse(req.body);
  const result = await authService.loginUser(validatedData);

  res
    .status(HTTP_STATUS.OK)
    .cookie('token', result.token, cookieOptions)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        result,
        'User authentication completed successfully.'
      )
    );
});

/**
 * GET /api/v1/auth/profile
 * Get logged-in user profile (Protected)
 */
export const getProfile = asyncHandler(async (req, res) => {
  const profileData = await authService.getUserProfile(req.user.id);
  const { onboarding, ...user } = profileData;

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        { user, onboarding },
        'User profile retrieved successfully.'
      )
    );
});

/**
 * POST /api/v1/auth/logout
 * Logout user & clear cookie (Protected)
 */
export const logout = asyncHandler(async (req, res) => {
  res
    .status(HTTP_STATUS.OK)
    .clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    })
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        null,
        'Logged out successfully.'
      )
    );
});

/**
 * POST /api/v1/auth/forgot-password
 * Send password reset link to user's email
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const validatedData = forgotPasswordSchema.parse(req.body);
  await authService.forgotPassword(validatedData);

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        null,
        'Password reset link has been sent to your email.'
      )
    );
});

/**
 * POST /api/v1/auth/reset-password
 * Verify reset token and update password
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const validatedData = resetPasswordSchema.parse(req.body);
  await authService.resetPassword(validatedData);

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        null,
        'Password has been reset successfully.'
      )
    );
});

/**
 * GET /api/v1/auth/my-menus
 * Fetch dynamic sidebar menus based on user's role and ABAC overrides
 */
export const getMyMenus = asyncHandler(async (req, res) => {
  const user = req.user;

  // Super admin gets all menus
  if (user.role === 'ADMIN' && user.id === 'admin') {
     const allMenus = await prisma.menu.findMany({ orderBy: { order: 'asc' } });
     return res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, allMenus, 'Admin menus retrieved'));
  }

  // 1. Get base custom role
  let customRoleId = user.customRoleId;
  if (!customRoleId) {
    const baseRole = await prisma.customRole.findFirst({
      where: { name: user.role, collegeId: null }
    });
    if (baseRole) customRoleId = baseRole.id;
  }

  // 2. Fetch Role Permissions
  let roleMenus = [];
  if (customRoleId) {
    const rolePermissions = await prisma.roleMenuPermission.findMany({
      where: { customRoleId },
      include: { menu: true }
    });
    // Include menus where user has at least READ access
    roleMenus = rolePermissions.filter(p => p.actions.includes('READ')).map(p => p.menu);
  }

  // 3. Fetch User Overrides (ABAC)
  const userPermissions = await prisma.userMenuPermission.findMany({
    where: { userId: user.id },
    include: { menu: true }
  });

  const userMenuMap = new Map();
  userPermissions.forEach(p => {
     if (p.actions.includes('READ')) {
       userMenuMap.set(p.menu.id, p.menu);
     } else {
       // Explicitly denied READ access
       userMenuMap.set(p.menu.id, null);
     }
  });

  // 4. Merge
  const finalMenuMap = new Map();
  roleMenus.forEach(m => {
     // If user override didn't explicitly deny it
     if (userMenuMap.get(m.id) !== null) {
        finalMenuMap.set(m.id, m);
     }
  });

  // Add any explicitly granted overrides
  userMenuMap.forEach((m, id) => {
     if (m !== null) finalMenuMap.set(id, m);
  });

  const sortedMenus = Array.from(finalMenuMap.values()).sort((a, b) => a.order - b.order);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, sortedMenus, 'User menus retrieved successfully.')
  );
});
