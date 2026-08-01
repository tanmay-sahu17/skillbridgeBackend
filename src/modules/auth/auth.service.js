import bcrypt from 'bcryptjs';
import prisma from '../../core/prisma.js';
import { ApiError } from '../../core/ApiError.js';
import { generateToken } from '../../utils/jwt.js';
import { HTTP_STATUS } from '../../constants/index.js';

/**
 * Register a new user
 * If role is COLLEGE, also creates an empty College record for onboarding
 */
export const registerUser = async ({ name, email, password, role }) => {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      'User with this email already exists.'
    );
  }

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  // If role is COLLEGE, create empty college record for onboarding
  let onboarding = null;
  if (role === 'COLLEGE') {
    const college = await prisma.college.create({
      data: {
        userId: user.id,
      },
    });
    onboarding = {
      onboardingCompleted: college.onboardingCompleted,
      currentStep: college.currentStep,
      completedSections: college.completedSections,
    };
  }

  // Generate JWT token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return { user, token, onboarding };
};

/**
 * Login user with email & password
 */
export const loginUser = async ({ email, password }) => {
  // Find user by email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      'Invalid email or password.'
    );
  }

  // Check if account is active
  if (!user.isActive) {
    throw new ApiError(
      HTTP_STATUS.FORBIDDEN,
      'Your account has been deactivated. Contact admin.'
    );
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(
      HTTP_STATUS.UNAUTHORIZED,
      'Invalid email or password.'
    );
  }

  // Generate JWT token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  // For COLLEGE role, fetch onboarding status
  let onboarding = null;
  if (user.role === 'COLLEGE') {
    const college = await prisma.college.findUnique({
      where: { userId: user.id },
      select: {
        onboardingCompleted: true,
        currentStep: true,
        completedSections: true,
        status: true,
      },
    });
    if (college) {
      onboarding = {
        onboardingCompleted: college.onboardingCompleted,
        currentStep: college.currentStep,
        completedSections: college.completedSections,
        status: college.status,
      };
    }
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token, onboarding };
};

/**
 * Get user profile by ID
 */
export const getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found.');
  }

  // For COLLEGE role, include onboarding status
  let onboarding = null;
  if (user.role === 'COLLEGE') {
    const college = await prisma.college.findUnique({
      where: { userId: user.id },
      select: {
        onboardingCompleted: true,
        currentStep: true,
        completedSections: true,
        status: true,
      },
    });
    if (college) {
      onboarding = {
        onboardingCompleted: college.onboardingCompleted,
        currentStep: college.currentStep,
        completedSections: college.completedSections,
        status: college.status,
      };
    }
  }

  return { ...user, onboarding };
};
