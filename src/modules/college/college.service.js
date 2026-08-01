import prisma from '../../core/prisma.js';
import { ApiError } from '../../core/ApiError.js';
import { HTTP_STATUS, ONBOARDING_SECTIONS } from '../../constants/index.js';
import cloudinary from '../../config/cloudinary.config.js';
import fs from 'fs/promises';

// ═══════════════════════════════════════════
// Helper: Update a section and track progress
// ═══════════════════════════════════════════

const updateSectionAndProgress = async (
  userId,
  sectionNumber,
  sectionField,
  data
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
  if (!completedSections.includes(sectionNumber)) {
    completedSections.push(sectionNumber);
  }

  // Calculate next step (highest completed + 1, max 9)
  const nextStep = Math.min(Math.max(...completedSections) + 1, 9);

  const updated = await prisma.college.update({
    where: { userId },
    data: {
      [sectionField]: data,
      completedSections,
      currentStep: nextStep,
    },
  });

  return updated;
};

// ═══════════════════════════════════════════
// Helper: Upload file to Cloudinary
// ═══════════════════════════════════════════

const uploadToCloudinary = async (filePath, folder) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `skillbridge/${folder}`,
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
      'logos'
    );
  }
  if (files.affiliationCert?.[0]) {
    documentData.affiliationCert = await uploadToCloudinary(
      files.affiliationCert[0].path,
      'certificates'
    );
  }
  if (files.authorizationLetter?.[0]) {
    documentData.authorizationLetter = await uploadToCloudinary(
      files.authorizationLetter[0].path,
      'certificates'
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
      'certificates'
    );
  }
  if (files.nirfCertificate?.[0]) {
    documentData.nirfCertificate = await uploadToCloudinary(
      files.nirfCertificate[0].path,
      'certificates'
    );
  }
  if (files.collegeBrochure?.[0]) {
    documentData.collegeBrochure = await uploadToCloudinary(
      files.collegeBrochure[0].path,
      'brochures'
    );
  }
  if (files.gstCertificate?.[0]) {
    documentData.gstCertificate = await uploadToCloudinary(
      files.gstCertificate[0].path,
      'certificates'
    );
  }

  // ── Multiple Other Certificates ──
  if (files.otherCertificates?.length > 0) {
    documentData.otherCertificates = [];
    for (const file of files.otherCertificates) {
      const url = await uploadToCloudinary(file.path, 'certificates');
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
// Section 7: Platform Preferences
// ═══════════════════════════════════════════

export const savePlatformPreferences = async (userId, data) => {
  return updateSectionAndProgress(
    userId,
    ONBOARDING_SECTIONS.PLATFORM_PREFERENCES,
    'platformPreferences',
    data
  );
};

// ═══════════════════════════════════════════
// Section 8: Verification (OTP logic placeholder)
// ═══════════════════════════════════════════

export const saveVerification = async (userId, data) => {
  return updateSectionAndProgress(
    userId,
    ONBOARDING_SECTIONS.VERIFICATION,
    'verification',
    data
  );
};

// ═══════════════════════════════════════════
// Section 9: Terms & Declaration
// ═══════════════════════════════════════════

export const acceptTerms = async (userId, data) => {
  const college = await prisma.college.findUnique({ where: { userId } });

  if (!college) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'College record not found.');
  }

  // Ensure all 8 sections are completed before accepting terms
  const requiredSections = [1, 2, 3, 4, 5, 6, 7, 8];
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

  // Mark section 9 as completed
  if (!completedSections.includes(9)) {
    completedSections.push(9);
  }

  return prisma.college.update({
    where: { userId },
    data: {
      termsAccepted: data.termsAccepted,
      authorizedConfirmed: data.authorizedConfirmed,
      accuracyConfirmed: data.accuracyConfirmed,
      completedSections,
      currentStep: 9,
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
      platformPreferences: !!college.platformPreferences,
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
