import asyncHandler from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../core/ApiResponse.js';
import { registerSchema, loginSchema, verifyEmailSchema, resendOtpSchema } from './auth.validation.js';
import * as authService from './auth.service.js';
import { HTTP_STATUS } from '../../constants/index.js';

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
    .cookie('token', result.token, cookieOptions)
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
  await authService.verifyEmail(validatedData);

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        null,
        'Email verified successfully. You can now access your account.'
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
  const user = await authService.getUserProfile(req.user.id);

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        { user },
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
