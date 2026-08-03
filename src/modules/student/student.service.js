import prisma from '../../core/prisma.js';
import { ApiError } from '../../core/ApiError.js';
import { HTTP_STATUS } from '../../constants/index.js';
import { uploadToImageKit } from '../../config/imagekit.config.js';
import { sendOtpSMS } from '../../utils/sms.js';
import { generateOtp } from '../../utils/mailer.js';
import { checkOtpRateLimit, resetOtpTracker } from '../../utils/otpTracker.js';

// Section Enum for Student Onboarding (1 to 9)
const STUDENT_SECTIONS = {
  BASIC_INFO: 1,
  CONTACT_INFO: 2,
  ACADEMIC_INFO: 3,
  CAREER_PROFILE: 4,
  PORTFOLIO: 5,
  DOCUMENTS: 6,
  PLATFORM_ROLE: 7,
  VERIFICATION: 8,
  DECLARATION: 9,
};

// ═══════════════════════════════════════════
// Helper: Update a section and track progress
// ═══════════════════════════════════════════

const updateSectionAndProgress = async (
  userId,
  sectionNumber,
  sectionField,
  data,
  sectionsToRemove = []
) => {
  const student = await prisma.student.findUnique({ where: { userId } });

  if (!student) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      'Student record not found. Please register first.'
    );
  }

  // Track completed sections
  let completedSections = student.completedSections || [];
  if (!completedSections.includes(sectionNumber)) {
    completedSections.push(sectionNumber);
  }

  // Remove sections if requested
  if (sectionsToRemove && sectionsToRemove.length > 0) {
    completedSections = completedSections.filter(s => !sectionsToRemove.includes(s));
  }

  // Calculate next step (highest completed + 1, max 9)
  const nextStep = Math.min(Math.max(...completedSections) + 1, 9);

  const updated = await prisma.student.update({
    where: { userId },
    data: {
      [sectionField]: { set: data },
      completedSections: { set: completedSections },
      currentStep: nextStep,
    },
  });

  return updated;
};

// ═══════════════════════════════════════════
// Section 1: Basic Information
// ═══════════════════════════════════════════

export const saveBasicInfo = async (userId, data) => {
  return updateSectionAndProgress(
    userId,
    STUDENT_SECTIONS.BASIC_INFO,
    'basicInfo',
    data
  );
};

// ═══════════════════════════════════════════
// Section 2: Contact Information
// ═══════════════════════════════════════════

export const saveContactInfo = async (userId, data) => {
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Student record not found.');
  }

  if (data.alternateMobile === '') {
    data.alternateMobile = null;
  }
  let resetMobile = false;
  let sectionsToRemove = [];

  if (student.contactInfo) {
    if (data.mobileNumber !== student.contactInfo.mobileNumber) {
      resetMobile = true;
    }
  }

  if (resetMobile) {
    const existingVerification = student.verification || { emailVerified: true, mobileVerified: false };
    const newVerification = {
      ...existingVerification,
      mobileVerified: false
    };

    sectionsToRemove.push(STUDENT_SECTIONS.VERIFICATION); // 8

    await prisma.student.update({
      where: { userId },
      data: {
        verification: { set: newVerification }
      }
    });
  }

  return updateSectionAndProgress(
    userId,
    STUDENT_SECTIONS.CONTACT_INFO,
    'contactInfo',
    data,
    sectionsToRemove
  );
};

// ═══════════════════════════════════════════
// Section 3: Academic Information
// ═══════════════════════════════════════════

export const saveAcademicInfo = async (userId, data) => {
  return updateSectionAndProgress(
    userId,
    STUDENT_SECTIONS.ACADEMIC_INFO,
    'academicInfo',
    data
  );
};

// ═══════════════════════════════════════════
// Section 4: Skills & Career Profile
// ═══════════════════════════════════════════

export const saveCareerProfile = async (userId, data) => {
  return updateSectionAndProgress(
    userId,
    STUDENT_SECTIONS.CAREER_PROFILE,
    'careerProfile',
    data
  );
};

// ═══════════════════════════════════════════
// Section 5: Portfolio & Social Links
// ═══════════════════════════════════════════

export const savePortfolio = async (userId, data, file) => {
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Student record not found.');
  }

  const existingPortfolio = student.portfolio || {};
  let resumeUrl = existingPortfolio.resumeUrl;

  // Upload resume if provided
  if (file) {
    resumeUrl = await uploadToImageKit(
      file.path,
      'student',
      userId,
      'resume',
      file.originalname
    );
  }

  // Combine data
  const portfolioData = {
    ...existingPortfolio,
    ...data,
    resumeUrl,
  };

  return updateSectionAndProgress(
    userId,
    STUDENT_SECTIONS.PORTFOLIO,
    'portfolio',
    portfolioData
  );
};

// ═══════════════════════════════════════════
// Section 6: Documents
// ═══════════════════════════════════════════

export const saveDocuments = async (userId, files) => {
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Student record not found.');
  }

  const existingDocs = student.documents || {};
  const documentData = {};

  // Upload Mandatory ID Card Front
  if (files.studentIdCardFront?.[0]) {
    documentData.studentIdCardFront = await uploadToImageKit(
      files.studentIdCardFront[0].path,
      'student', userId, 'documents', files.studentIdCardFront[0].originalname
    );
  }
  
  if (!documentData.studentIdCardFront && !existingDocs.studentIdCardFront) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Student ID Card (Front) is required.');
  }

  // Upload Optionals
  if (files.studentIdCardBack?.[0]) {
    documentData.studentIdCardBack = await uploadToImageKit(
      files.studentIdCardBack[0].path,
      'student', userId, 'documents', files.studentIdCardBack[0].originalname
    );
  }
  if (files.bonafideCert?.[0]) {
    documentData.bonafideCert = await uploadToImageKit(
      files.bonafideCert[0].path,
      'student', userId, 'documents', files.bonafideCert[0].originalname
    );
  }
  if (files.feeReceipt?.[0]) {
    documentData.feeReceipt = await uploadToImageKit(
      files.feeReceipt[0].path,
      'student', userId, 'documents', files.feeReceipt[0].originalname
    );
  }

  const mergedDocs = { ...existingDocs, ...documentData };

  return updateSectionAndProgress(
    userId,
    STUDENT_SECTIONS.DOCUMENTS,
    'documents',
    mergedDocs
  );
};

// ═══════════════════════════════════════════
// Section 7: Platform Role
// ═══════════════════════════════════════════

export const savePlatformRole = async (userId, data) => {
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Student record not found.');
  }
  
  const completedSections = student.completedSections || [];
  if (!completedSections.includes(STUDENT_SECTIONS.PLATFORM_ROLE)) {
    completedSections.push(STUDENT_SECTIONS.PLATFORM_ROLE);
  }
  const nextStep = Math.min(Math.max(...completedSections) + 1, 9);

  return prisma.student.update({
    where: { userId },
    data: {
      platformRole: data.platformRole,
      completedSections: { set: completedSections },
      currentStep: nextStep,
    },
  });
};

// ═══════════════════════════════════════════
// Section 8: Verification
// ═══════════════════════════════════════════

export const saveVerification = async (userId, data) => {
  return updateSectionAndProgress(
    userId,
    STUDENT_SECTIONS.VERIFICATION,
    'verification',
    data
  );
};

export const sendMobileOtp = async (userId) => {
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student || !student.contactInfo || !student.contactInfo.mobileNumber) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Please save contact info with a valid mobile number first.');
  }

  const mobile = student.contactInfo.mobileNumber;

  if (student.verification?.mobileVerified) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Mobile number is already verified.');
  }

  // Check rate limit before sending OTP
  await checkOtpRateLimit(mobile);
  
  // Request SMS from Twilio which auto-generates the OTP
  const message = await sendOtpSMS(mobile);
  
  // Extract OTP from Twilio response body
  const match = message?.body?.match(/verification code is (\d+)/);
  if (!match) {
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to generate OTP via SMS provider.');
  }
  const otp = match[1];

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  await prisma.otp.deleteMany({ where: { mobile } });
  await prisma.otp.create({ data: { mobile, otp, expiresAt } });

  return { message: 'OTP sent successfully to ' + mobile };
};

export const verifyMobileOtp = async (userId, otp) => {
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student || !student.contactInfo || !student.contactInfo.mobileNumber) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Contact info missing.');
  }

  const mobile = student.contactInfo.mobileNumber;
  const otpRecord = await prisma.otp.findFirst({
    where: { mobile },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No OTP found. Please request a new one.');
  if (otpRecord.otp !== otp) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid OTP.');
  if (new Date() > otpRecord.expiresAt) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'OTP has expired.');

  await prisma.otp.deleteMany({ where: { mobile } });

  // Reset tracker on successful verification
  await resetOtpTracker(mobile);

  // Update verification status
  return updateSectionAndProgress(
    userId,
    STUDENT_SECTIONS.VERIFICATION,
    'verification',
    { emailVerified: true, mobileVerified: true }
  );
};

// ═══════════════════════════════════════════
// Section 9: Declaration
// ═══════════════════════════════════════════

export const saveDeclaration = async (userId, data) => {
  const student = await prisma.student.findUnique({ where: { userId } });

  if (!student) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Student record not found.');
  }

  // Ensure all 8 sections are completed before accepting declaration
  const requiredSections = [1, 2, 3, 4, 5, 6, 7, 8];
  const completedSections = student.completedSections || [];
  const missingSections = requiredSections.filter(
    (s) => !completedSections.includes(s)
  );

  if (missingSections.length > 0) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      `Please complete all sections before submitting. Missing sections: ${missingSections.join(', ')}`
    );
  }

  // Mark section 9 as completed
  if (!completedSections.includes(9)) {
    completedSections.push(9);
  }

  return prisma.student.update({
    where: { userId },
    data: {
      infoCorrectConfirmed: data.infoCorrectConfirmed,
      collegeVerifyAccepted: data.collegeVerifyAccepted,
      termsAccepted: data.termsAccepted,
      completedSections: { set: completedSections },
      currentStep: 9,
      onboardingCompleted: true,
      status: 'PENDING', // Translates to "Pending College Verification"
    },
  });
};

// ═══════════════════════════════════════════
// Get Onboarding Progress
// ═══════════════════════════════════════════

export const getOnboardingProgress = async (userId) => {
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true, email: true, role: true } },
    },
  });

  if (!student) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Student record not found.');
  }

  return {
    currentStep: student.currentStep,
    completedSections: student.completedSections,
    onboardingCompleted: student.onboardingCompleted,
    status: student.status,
    sections: {
      basicInfo: !!student.basicInfo,
      contactInfo: !!student.contactInfo,
      academicInfo: !!student.academicInfo,
      careerProfile: !!student.careerProfile,
      portfolio: !!student.portfolio,
      documents: !!student.documents,
      platformRole: !!student.platformRole,
      verification: !!student.verification,
      declaration: student.termsAccepted,
    },
  };
};

// ═══════════════════════════════════════════
// Get Full Student Data
// ═══════════════════════════════════════════

export const getStudentData = async (userId) => {
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
      college: {
        select: { id: true, basicInfo: true }
      }
    },
  });

  if (!student) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Student record not found.');
  }

  return student;
};
