import { z } from 'zod';

export const createGigSchema = z.object({
  body: z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(100),
    description: z.string().min(20, 'Description must be detailed enough (min 20 chars)'),
    category: z.string().optional(),
    skillsRequired: z.array(z.string()).min(1, 'At least one skill is required'),
    duration: z.string().optional(),
    budget: z.number().nonnegative().optional(),
    paymentEnabled: z.boolean().optional(),
  }),
});

export const resubmitGigSchema = createGigSchema;

export const reviewGigSchema = z.object({
  params: z.object({ id: z.string().length(24, 'Invalid ID format') }),
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED', 'CHANGES_REQUESTED']),
    feedback: z.string().optional(),
  }),
});

export const applyToGigSchema = z.object({
  params: z.object({ id: z.string().length(24, 'Invalid ID format') }),
  body: z.object({
    coverLetter: z.string().min(10, 'Cover letter should be at least 10 chars').optional(),
    resumeUrl: z.string().url('Invalid resume URL').optional(),
  }),
});

export const updateApplicantStatusSchema = z.object({
  params: z.object({
    gigId: z.string().length(24),
    applicantId: z.string().length(24),
  }),
  body: z.object({
    status: z.enum(['UNDER_REVIEW', 'INTERVIEW_SCHEDULED', 'SELECTED', 'REJECTED']),
    notes: z.string().optional(),
  }),
});

export const createTaskSchema = z.object({
  params: z.object({ gigId: z.string().length(24) }),
  body: z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    points: z.number().int().positive().optional(),
    assigneeId: z.string().length(24).optional(),
  }),
});

export const updateTaskStatusSchema = z.object({
  params: z.object({
    gigId: z.string().length(24),
    taskId: z.string().length(24),
  }),
  body: z.object({
    status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
  }),
});
