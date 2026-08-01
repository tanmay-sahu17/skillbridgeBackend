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
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});
