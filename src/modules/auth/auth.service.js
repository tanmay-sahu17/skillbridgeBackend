import bcrypt from 'bcryptjs';
import prisma from '../../core/prisma.js';
import { ApiError } from '../../core/ApiError.js';
import { generateToken } from '../../utils/jwt.js';
import { HTTP_STATUS } from '../../constants/index.js';
import { sendEmail, generateOtp } from '../../utils/mailer.js';
import { getOtpTemplate } from '../../utils/emailTemplates.js';

/**
 * Register a new user
 * If role is COLLEGE, also creates an empty College record for onboarding
 */
export const registerUser = async ({ name, email, password, role, collegeId }) => {
  // Common validation for STUDENT role
  let college = null;
  if (role === 'STUDENT') {
    if (!collegeId) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'collegeId is required for student registration.');
    }
    
    college = await prisma.college.findUnique({
      where: { id: collegeId },
    });
    
    if (!college) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Selected college not found.');
    }
    
    if (college.status !== 'APPROVED') {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Selected college is not yet approved.');
    }
    
    const domain = college.basicInfo?.domain;
    if (!domain) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Selected college does not have a registered domain for student signups.');
    }
    
    if (!email.endsWith(`@${domain}`)) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Please use your official college email ending with @${domain}`);
    }
  }
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

  // Role specific records
  let onboarding = null;
  if (role === 'COLLEGE') {
    const newCollege = await prisma.college.create({
      data: {
        userId: user.id,
      },
    });
    onboarding = {
      onboardingCompleted: newCollege.onboardingCompleted,
      currentStep: newCollege.currentStep,
      completedSections: newCollege.completedSections,
    };
  } else if (role === 'STUDENT') {
    const newStudent = await prisma.student.create({
      data: {
        userId: user.id,
        collegeId,
      },
    });
    onboarding = {
      onboardingCompleted: newStudent.onboardingCompleted,
      currentStep: newStudent.currentStep,
      completedSections: newStudent.completedSections,
    };
  }

  // Generate and save OTP
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

  await prisma.otp.create({
    data: {
      email: user.email,
      otp,
      expiresAt,
    },
  });

  // Send OTP email asynchronously
  const emailHtml = getOtpTemplate(otp);
  sendEmail(user.email, 'SkillBridge - Verify your email', emailHtml).catch(
    (err) => console.error('Failed to send OTP email:', err)
  );

  // Generate JWT token (user is not verified yet, but they can use this token for the verification endpoint)
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return { user, token, onboarding, message: 'Please verify your email using the OTP sent to you.' };
};

/**
 * Verify Email using OTP
 */
export const verifyEmail = async ({ email, otp }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found.');
  }
  if (user.isEmailVerified) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email is already verified.');
  }

  // Find latest OTP for this email
  const otpRecord = await prisma.otp.findFirst({
    where: { email },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No OTP found. Please request a new one.');
  }

  if (otpRecord.otp !== otp) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid OTP.');
  }

  if (new Date() > otpRecord.expiresAt) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'OTP has expired. Please request a new one.');
  }

  // Update user as verified
  await prisma.user.update({
    where: { email },
    data: { isEmailVerified: true },
  });

  // Delete all OTPs for this email to prevent reuse
  await prisma.otp.deleteMany({ where: { email } });

  return { success: true };
};

/**
 * Resend OTP
 */
export const resendOtp = async ({ email }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found.');
  }
  if (user.isEmailVerified) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email is already verified.');
  }

  // Delete old OTPs
  await prisma.otp.deleteMany({ where: { email } });

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.otp.create({
    data: { email, otp, expiresAt },
  });

  const emailHtml = getOtpTemplate(otp);
  await sendEmail(user.email, 'SkillBridge - Your new OTP', emailHtml);

  return { success: true };
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

  // For COLLEGE and STUDENT roles, fetch onboarding status
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
  } else if (user.role === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: {
        onboardingCompleted: true,
        currentStep: true,
        completedSections: true,
        status: true,
      },
    });
    if (student) {
      onboarding = {
        onboardingCompleted: student.onboardingCompleted,
        currentStep: student.currentStep,
        completedSections: student.completedSections,
        status: student.status,
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
      isEmailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found.');
  }

  // For COLLEGE and STUDENT roles, include onboarding status
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
  } else if (user.role === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      select: {
        onboardingCompleted: true,
        currentStep: true,
        completedSections: true,
        status: true,
      },
    });
    if (student) {
      onboarding = {
        onboardingCompleted: student.onboardingCompleted,
        currentStep: student.currentStep,
        completedSections: student.completedSections,
        status: student.status,
      };
    }
  }

  return { ...user, onboarding };
};
