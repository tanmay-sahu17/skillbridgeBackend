import { z } from 'zod';

// ── Reusable validation schemas ──
// Ek baar yahan define, poore project mein use karo

export const emailSchema = z
  .string({ required_error: 'Email is required' })
  .email('Please enter a valid email address')
  .toLowerCase()
  .trim();

export const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const phoneSchema = z
  .string({ required_error: 'Phone number is required' })
  .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number');

export const optionalPhoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number')
  .optional()
  .or(z.literal(''));

export const pinCodeSchema = z
  .string({ required_error: 'PIN code is required' })
  .regex(/^\d{6}$/, 'Please enter a valid 6-digit PIN code');

export const urlSchema = z
  .string({ required_error: 'URL is required' })
  .url('Please enter a valid URL')
  .trim();

export const optionalUrlSchema = z
  .string()
  .url('Please enter a valid URL')
  .trim()
  .optional()
  .or(z.literal(''));

export const yearSchema = z
  .number({ required_error: 'Year is required' })
  .int('Year must be a whole number')
  .min(1800, 'Year must be after 1800')
  .max(new Date().getFullYear(), 'Year cannot be in the future');

export const nameSchema = z
  .string({ required_error: 'Name is required' })
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .trim();
