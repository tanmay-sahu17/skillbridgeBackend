import prisma from '../../core/prisma.js';
import { ApiError } from '../../core/ApiError.js';
import { HTTP_STATUS, ONBOARDING_SECTIONS } from '../../constants/index.js';
import cloudinary from '../../config/cloudinary.config.js';
import fs from 'fs/promises';
import { sendOtpSMS } from '../../utils/sms.js';
import { generateOtp, sendEmail } from '../../utils/mailer.js';
import { checkOtpRateLimit, resetOtpTracker } from '../../utils/otpTracker.js';
import { getOtpTemplate } from '../../utils/emailTemplates.js';

// ═══════════════════════════════════════════
// Helper: Update a section and track progress
// ═══════════════════════════════════════════

const updateSectionAndProgress = async (
  userId,
  sectionNumber,
  sectionField,
  data,
  isComplete = true
) => {
  const college = await prisma.college.findUnique({ where: { userId } });

  if (!college) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      'College record not found. Please register first.'
    );
  }

  // Track completed sections
  const completedSections = college.completedSections || [];
  if (isComplete && !completedSections.includes(sectionNumber)) {
    completedSections.push(sectionNumber);
  }

  // Calculate next step (highest completed + 1, max 8)
  const nextStep = Math.min(Math.max(...completedSections) + 1, 8);

  const updated = await prisma.college.update({
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
// Helper: Upload file to Cloudinary
// ═══════════════════════════════════════════

/**
 * Upload file to Cloudinary with organized folder structure:
 * skillbridge/{role}/{userId}/{category}
 *
 * Example paths:
 *   skillbridge/college/abc123/logos
 *   skillbridge/college/abc123/certificates
 *   skillbridge/student/xyz456/resume
 *   skillbridge/recruiter/xyz789/profile
 */
const uploadToCloudinary = async (filePath, role, userId, category) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `skillbridge/${role}/${userId}/${category}`,
      resource_type: 'auto',
    });
    // Delete local temp file after successful upload
    await fs.unlink(filePath);
    return result.secure_url;
  } catch (error) {
    // Clean up temp file on error too
    await fs.unlink(filePath).catch(() => {});
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      `File upload failed: ${error.message}`
    );
  }
};

// ═══════════════════════════════════════════
// Section 1: Basic Information
// ═══════════════════════════════════════════

export const saveBasicInfo = async (userId, data) => {
  return updateSectionAndProgress(
    userId,
    ONBOARDING_SECTIONS.BASIC_INFO,
    'basicInfo',
    data
  );
};

// ═══════════════════════════════════════════
// Section 2: Contact Information
// ═══════════════════════════════════════════

export const saveContactInfo = async (userId, data) => {
  // Clean up empty optional fields
  if (data.alternateContact === '') {
    data.alternateContact = null;
  }

  if (data.socialLinks) {
    const { linkedin, facebook, instagram } = data.socialLinks;
    if (!linkedin && !facebook && !instagram) {
      data.socialLinks = null;
    } else {
      data.socialLinks = {
        linkedin: linkedin || null,
        facebook: facebook || null,
        instagram: instagram || null,
      };
    }
  }

  return updateSectionAndProgress(
    userId,
    ONBOARDING_SECTIONS.CONTACT_INFO,
    'contactInfo',
    data
  );
};

// ═══════════════════════════════════════════
// Section 3: Address Details
// ═══════════════════════════════════════════

export const saveAddress = async (userId, data) => {
  return updateSectionAndProgress(
    userId,
    ONBOARDING_SECTIONS.ADDRESS,
    'address',
    data
  );
};

// ═══════════════════════════════════════════
// Section 4: College Representative
// ═══════════════════════════════════════════

export const saveRepresentative = async (userId, data) => {
  return updateSectionAndProgress(
    userId,
    ONBOARDING_SECTIONS.REPRESENTATIVE,
    'representative',
    {
      ...data,
      employeeId: data.employeeId || null,
    }
  );
};

// ═══════════════════════════════════════════
// Section 5: Documents (File Upload)
// ═══════════════════════════════════════════

export const saveDocuments = async (userId, files) => {
  const college = await prisma.college.findUnique({ where: { userId } });
  if (!college) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'College record not found.');
  }

  const existingDocs = college.documents || {};
  const documentData = {};

  // ── Required Documents ──
  if (files.collegeLogo?.[0]) {
    documentData.collegeLogo = await uploadToCloudinary(
      files.collegeLogo[0].path,
      'college', userId, 'logos'
    );
  }
  if (files.affiliationCert?.[0]) {
    documentData.affiliationCert = await uploadToCloudinary(
      files.affiliationCert[0].path,
      'college', userId, 'certificates'
    );
  }
  if (files.authorizationLetter?.[0]) {
    documentData.authorizationLetter = await uploadToCloudinary(
      files.authorizationLetter[0].path,
      'college', userId, 'certificates'
    );
  }

  // Validate required documents exist (either new upload or already saved)
  if (!documentData.collegeLogo && !existingDocs.collegeLogo) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'College Logo is required.');
  }
  if (!documentData.affiliationCert && !existingDocs.affiliationCert) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Affiliation Certificate is required.'
    );
  }
  if (!documentData.authorizationLetter && !existingDocs.authorizationLetter) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Authorization Letter is required.'
    );
  }

  // ── Optional Documents ──
  if (files.naacCertificate?.[0]) {
    documentData.naacCertificate = await uploadToCloudinary(
      files.naacCertificate[0].path,
      'college', userId, 'certificates'
    );
  }
  if (files.nirfCertificate?.[0]) {
    documentData.nirfCertificate = await uploadToCloudinary(
      files.nirfCertificate[0].path,
      'college', userId, 'certificates'
    );
  }
  if (files.collegeBrochure?.[0]) {
    documentData.collegeBrochure = await uploadToCloudinary(
      files.collegeBrochure[0].path,
      'college', userId, 'brochures'
    );
  }
  if (files.gstCertificate?.[0]) {
    documentData.gstCertificate = await uploadToCloudinary(
      files.gstCertificate[0].path,
      'college', userId, 'certificates'
    );
  }

  // ── Multiple Other Certificates ──
  if (files.otherCertificates?.length > 0) {
    documentData.otherCertificates = [];
    for (const file of files.otherCertificates) {
      const url = await uploadToCloudinary(file.path, 'college', userId, 'certificates');
      documentData.otherCertificates.push(url);
    }
  }

  // Merge new uploads with existing documents
  const mergedDocs = { ...existingDocs, ...documentData };
  if (!mergedDocs.otherCertificates) {
    mergedDocs.otherCertificates = [];
  }

  return updateSectionAndProgress(
    userId,
    ONBOARDING_SECTIONS.DOCUMENTS,
    'documents',
    mergedDocs
  );
};

// ═══════════════════════════════════════════
// Section 6: Academic Information
// ═══════════════════════════════════════════

export const saveAcademicInfo = async (userId, data) => {
  return updateSectionAndProgress(
    userId,
    ONBOARDING_SECTIONS.ACADEMIC_INFO,
    'academicInfo',
    data
  );
};

// ═══════════════════════════════════════════
// Section 7: Verification (OTP logic placeholder)
// ═══════════════════════════════════════════

export const saveVerification = async (userId, data) => {
  return updateSectionAndProgress(
    userId,
    ONBOARDING_SECTIONS.VERIFICATION,
    'verification',
    data
  );
};

export const sendMobileOtp = async (userId) => {
  const college = await prisma.college.findUnique({ where: { userId } });
  if (!college || !college.contactInfo || !college.contactInfo.officialMobile) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Please save contact info with a valid mobile number first.');
  }

  const mobile = college.contactInfo.officialMobile;

  if (college.verification?.mobileVerified) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Mobile number is already verified.');
  }

  // Check rate limit before sending OTP
  await checkOtpRateLimit(mobile);
  
  // Request SMS from Twilio which auto-generates the OTP
  const message = await sendOtpSMS(mobile);
  
  // Extract OTP from Twilio response body: "Your verification code is 482913..."
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
  const college = await prisma.college.findUnique({ where: { userId } });
  if (!college || !college.contactInfo || !college.contactInfo.officialMobile) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Contact info missing.');
  }

  const mobile = college.contactInfo.officialMobile;
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
  const existingVerification = college.verification || { emailVerified: false, mobileVerified: false };
  const newVerification = { ...existingVerification, mobileVerified: true };
  const isComplete = newVerification.emailVerified && newVerification.mobileVerified;

  return updateSectionAndProgress(
    userId,
    ONBOARDING_SECTIONS.VERIFICATION,
    'verification',
    newVerification,
    isComplete
  );
};

export const sendEmailOtp = async (userId) => {
  const college = await prisma.college.findUnique({ where: { userId }, include: { user: true } });
  if (!college || !college.contactInfo || !college.contactInfo.officialEmail) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Please save contact info with a valid official email first.');
  }

  const officialEmail = college.contactInfo.officialEmail;
  if (college.verification?.emailVerified) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Official email is already verified.');
  }

  if (officialEmail === college.user.email) {
    // Auto-verify if it matches the registered email
    const existingVerification = college.verification || { emailVerified: false, mobileVerified: false };
    const newVerification = { ...existingVerification, emailVerified: true };
    const isComplete = newVerification.emailVerified && newVerification.mobileVerified;
    
    await updateSectionAndProgress(userId, ONBOARDING_SECTIONS.VERIFICATION, 'verification', newVerification, isComplete);
    return { message: 'Official email matches signup email and has been automatically verified.', autoVerified: true };
  }

  await checkOtpRateLimit(officialEmail);
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.otp.deleteMany({ where: { email: officialEmail } });
  await prisma.otp.create({ data: { email: officialEmail, otp, expiresAt } });

  const emailHtml = getOtpTemplate(otp);
  await sendEmail(officialEmail, 'SkillBridge - Verify Official Email', emailHtml);
  return { message: 'OTP sent successfully to ' + officialEmail, autoVerified: false };
};

export const verifyEmailOtp = async (userId, otp) => {
  const college = await prisma.college.findUnique({ where: { userId } });
  if (!college || !college.contactInfo || !college.contactInfo.officialEmail) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Contact info missing.');
  }

  const email = college.contactInfo.officialEmail;
  const otpRecord = await prisma.otp.findFirst({
    where: { email },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No OTP found. Please request a new one.');
  if (otpRecord.otp !== otp) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid OTP.');
  if (new Date() > otpRecord.expiresAt) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'OTP has expired.');

  await prisma.otp.deleteMany({ where: { email } });
  await resetOtpTracker(email);

  const existingVerification = college.verification || { emailVerified: false, mobileVerified: false };
  const newVerification = { ...existingVerification, emailVerified: true };
  const isComplete = newVerification.emailVerified && newVerification.mobileVerified;

  return updateSectionAndProgress(
    userId,
    ONBOARDING_SECTIONS.VERIFICATION,
    'verification',
    newVerification,
    isComplete
  );
};

// ═══════════════════════════════════════════
// Section 8: Terms & Declaration
// ═══════════════════════════════════════════

export const acceptTerms = async (userId, data) => {
  const college = await prisma.college.findUnique({ where: { userId } });

  if (!college) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'College record not found.');
  }

  // Ensure all 7 sections are completed before accepting terms
  const requiredSections = [1, 2, 3, 4, 5, 6, 7];
  const completedSections = college.completedSections || [];
  const missingSections = requiredSections.filter(
    (s) => !completedSections.includes(s)
  );

  if (missingSections.length > 0) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      `Please complete all sections before accepting terms. Missing sections: ${missingSections.join(', ')}`
    );
  }

  // Mark section 8 as completed
  if (!completedSections.includes(8)) {
    completedSections.push(8);
  }

  return prisma.college.update({
    where: { userId },
    data: {
      termsAccepted: data.termsAccepted,
      authorizedConfirmed: data.authorizedConfirmed,
      accuracyConfirmed: data.accuracyConfirmed,
      completedSections: { set: completedSections },
      currentStep: 8,
      onboardingCompleted: true,
      status: 'UNDER_REVIEW',
    },
  });
};

// ═══════════════════════════════════════════
// Get Onboarding Progress
// ═══════════════════════════════════════════

export const getOnboardingProgress = async (userId) => {
  const college = await prisma.college.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true, email: true, role: true } },
    },
  });

  if (!college) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'College record not found.');
  }

  return {
    currentStep: college.currentStep,
    completedSections: college.completedSections,
    onboardingCompleted: college.onboardingCompleted,
    status: college.status,
    sections: {
      basicInfo: !!college.basicInfo,
      contactInfo: !!college.contactInfo,
      address: !!college.address,
      representative: !!college.representative,
      documents: !!college.documents,
      academicInfo: !!college.academicInfo,
      verification: !!college.verification,
      terms: college.termsAccepted,
    },
  };
};

// ═══════════════════════════════════════════
// Get Full College Data
// ═══════════════════════════════════════════

export const getCollegeData = async (userId) => {
  const college = await prisma.college.findUnique({
    where: { userId },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  if (!college) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'College record not found.');
  }

  return college;
};

// ═══════════════════════════════════════════
// Get College List (Public)
// ═══════════════════════════════════════════

export const getCollegeList = async () => {
  const colleges = await prisma.college.findMany({
    where: { status: 'APPROVED' },
    select: {
      id: true,
      basicInfo: true,
    },
  });

  return colleges.map(c => ({
    id: c.id,
    collegeName: c.basicInfo?.collegeName,
    shortName: c.basicInfo?.shortName,
    domain: c.basicInfo?.domain,
  }));
};
