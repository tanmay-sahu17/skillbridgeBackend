import { z } from 'zod';
import {
  emailSchema,
  phoneSchema,
  optionalPhoneSchema,
  urlSchema,
  optionalUrlSchema,
  nameSchema,
} from '../../helpers/validations/common.validation.js';

// ── Section 1: Basic Information ──
export const studentBasicInfoSchema = z.object({
  firstName: nameSchema,
  middleName: z.string().trim().optional(),
  lastName: nameSchema,
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dateOfBirth: z.coerce.date().optional(),
});

// ── Section 2: Contact Information ──
export const studentContactInfoSchema = z.object({
  personalEmail: emailSchema,
  mobileNumber: phoneSchema,
  alternateMobile: optionalPhoneSchema,
});

// ── Section 3: Academic Information ──
export const studentAcademicInfoSchema = z.object({
  enrollmentNo: z.string({ required_error: 'Enrollment / Roll Number is required' }).min(2).trim(),
  studentIdNo: z.string().trim().optional(),
  course: z.string({ required_error: 'Course is required' }).min(2).trim(),
  branch: z.string({ required_error: 'Branch is required' }).min(2).trim(),
  currentYear: z.number().int().min(1).max(10),
  currentSemester: z.number().int().min(1).max(20),
  section: z.string().trim().optional(),
  batch: z.string({ required_error: 'Batch is required (e.g., 2024-2028)' }).min(4).trim(),
});

// ── Section 4: Skills & Career Profile ──
export const studentCareerProfileSchema = z.object({
  headline: z.string().max(100).trim().optional(),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
  careerInterest: z.array(
    z.enum(['INTERNSHIP', 'FULL_TIME', 'FREELANCING', 'STARTUP', 'RESEARCH', 'HIGHER_STUDIES'])
  ).min(1, 'At least one career interest must be selected'),
  languagesKnown: z.array(z.string()).min(1, 'At least one language is required'),
  bio: z.string().max(500).trim().optional(),
});

// ── Section 5: Portfolio & Social Links ──
// Note: Resume upload will be handled by multer, but URL can be passed if saving without upload
export const studentPortfolioSchema = z.object({
  linkedin: optionalUrlSchema,
  github: optionalUrlSchema,
  portfolioWebsite: optionalUrlSchema,
  leetcode: optionalUrlSchema,
  hackerrank: optionalUrlSchema,
  codechef: optionalUrlSchema,
  codeforces: optionalUrlSchema,
  behanceOrDribbble: optionalUrlSchema,
  otherLinks: z
    .array(
      z.object({
        type: z.string().min(1, 'Type is required'),
        url: urlSchema,
      })
    )
    .optional(),
});

// ── Section 7: Platform Role ──
export const studentPlatformRoleSchema = z.object({
  platformRole: z.enum(['FREELANCER', 'OPPORTUNITY_PROVIDER', 'BOTH'], {
    required_error: 'Platform role selection is required',
  }),
});

// ── Section 9: Declaration ──
export const studentDeclarationSchema = z.object({
  infoCorrectConfirmed: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm that all academic information is correct' }),
  }),
  collegeVerifyAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must understand that your college will verify your details' }),
  }),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the Terms & Privacy Policy' }),
  }),
});
