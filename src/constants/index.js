/**
 * System-wide HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * User Roles (matches Prisma enum)
 */
export const USER_ROLES = {
  COLLEGE: 'COLLEGE',
  STUDENT: 'STUDENT',
  RECRUITER: 'RECRUITER',
  TPO: 'TPO',
  ADMIN: 'ADMIN',
};

/**
 * Environment names
 */
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
};

/**
 * Onboarding section numbers (1-9)
 */
export const ONBOARDING_SECTIONS = {
  BASIC_INFO: 1,
  CONTACT_INFO: 2,
  ADDRESS: 3,
  REPRESENTATIVE: 4,
  DOCUMENTS: 5,
  ACADEMIC_INFO: 6,
  VERIFICATION: 7,
  TERMS: 8,
};

/**
 * College registration statuses (matches Prisma enum)
 */
export const COLLEGE_STATUS = {
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};
