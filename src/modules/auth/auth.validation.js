import { z } from 'zod';
import {
  emailSchema,
  passwordSchema,
  nameSchema,
} from '../../helpers/validations/common.validation.js';

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['COLLEGE', 'STUDENT', 'RECRUITER', 'TPO'], {
    required_error: 'Role is required',
    invalid_type_error:
      'Invalid role. Must be one of: COLLEGE, STUDENT, RECRUITER, TPO',
  }),
  collegeId: z.string().optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({
  email: emailSchema,
  otp: z
    .string({ required_error: 'OTP is required' })
    .length(6, 'OTP must be exactly 6 digits'),
});

export const resendOtpSchema = z.object({
  email: emailSchema,
});
