import { z } from 'zod';
import {
  emailSchema,
  phoneSchema,
  optionalPhoneSchema,
  pinCodeSchema,
  urlSchema,
  optionalUrlSchema,
  yearSchema,
  nameSchema,
} from '../../helpers/validations/common.validation.js';

// ── Section 1: Basic Information ──
export const basicInfoSchema = z.object({
  collegeName: z
    .string({ required_error: 'College name is required' })
    .min(2, 'College name must be at least 2 characters')
    .max(200)
    .trim(),
  shortName: z.string().max(20).trim().optional(),
  collegeType: z.enum(['GOVERNMENT', 'PRIVATE', 'AUTONOMOUS', 'DEEMED'], {
    required_error: 'College type is required',
  }),
  establishmentYear: yearSchema,
  affiliatedUniversity: z
    .string({ required_error: 'Affiliated university is required' })
    .min(2)
    .max(200)
    .trim(),
  accreditations: z
    .array(z.string())
    .min(1, 'At least one accreditation is required'),
});

// ── Section 2: Contact Information ──
export const contactInfoSchema = z.object({
  officialEmail: emailSchema,
  officialMobile: phoneSchema,
  alternateContact: optionalPhoneSchema,
  officialWebsite: urlSchema,
  socialLinks: z
    .object({
      linkedin: optionalUrlSchema,
      facebook: optionalUrlSchema,
      instagram: optionalUrlSchema,
    })
    .optional(),
});

// ── Section 3: Address Details ──
export const addressSchema = z.object({
  country: z
    .string({ required_error: 'Country is required' })
    .min(2)
    .trim(),
  state: z.string({ required_error: 'State is required' }).min(2).trim(),
  district: z
    .string({ required_error: 'District is required' })
    .min(2)
    .trim(),
  city: z.string({ required_error: 'City is required' }).min(2).trim(),
  pinCode: pinCodeSchema,
  completeAddress: z
    .string({ required_error: 'Complete address is required' })
    .min(10, 'Address must be at least 10 characters')
    .max(500)
    .trim(),
});

// ── Section 4: College Representative ──
export const representativeSchema = z.object({
  fullName: nameSchema,
  designation: z.enum(
    ['PRINCIPAL', 'DIRECTOR', 'TPO', 'DEAN', 'HOD', 'FACULTY', 'ADMIN_STAFF'],
    { required_error: 'Designation is required' }
  ),
  officialEmail: emailSchema,
  mobileNumber: phoneSchema,
  employeeId: z.string().max(50).trim().optional().or(z.literal('')),
});

// ── Section 6: Academic Information ──
export const academicInfoSchema = z.object({
  totalDepartments: z
    .number({ required_error: 'Total departments is required' })
    .int()
    .min(1),
  totalCourses: z
    .number({ required_error: 'Total courses is required' })
    .int()
    .min(1),
  totalStudents: z
    .number({ required_error: 'Total students is required' })
    .int()
    .min(1),
  totalFaculty: z
    .number({ required_error: 'Total faculty is required' })
    .int()
    .min(1),
  campusType: z.enum(['SINGLE', 'MULTIPLE'], {
    required_error: 'Campus type is required',
  }),
});

// ── Section 7: Platform Preferences ──
export const platformPreferencesSchema = z.object({
  allowStudentSelfRegistration: z.boolean({
    required_error: 'This field is required',
  }),
  studentApprovalRequired: z.boolean({
    required_error: 'This field is required',
  }),
  allowAlumniRegistration: z.boolean({
    required_error: 'This field is required',
  }),
  allowCompanyCollaborations: z.boolean({
    required_error: 'This field is required',
  }),
});

// ── Section 9: Terms & Declaration ──
export const termsSchema = z.object({
  termsAccepted: z.literal(true, {
    errorMap: () => ({
      message: 'You must accept the Terms & Privacy Policy',
    }),
  }),
  authorizedConfirmed: z.literal(true, {
    errorMap: () => ({
      message: 'You must confirm you are authorized to register this institution',
    }),
  }),
  accuracyConfirmed: z.literal(true, {
    errorMap: () => ({
      message: 'You must confirm all information provided is accurate',
    }),
  }),
});
