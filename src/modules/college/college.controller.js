import asyncHandler from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../core/ApiResponse.js';
import { ApiError } from '../../core/ApiError.js';
import { HTTP_STATUS } from '../../constants/index.js';
import * as collegeService from './college.service.js';
import {
  basicInfoSchema,
  contactInfoSchema,
  addressSchema,
  representativeSchema,
  academicInfoSchema,
  termsSchema,
} from './college.validation.js';

/**
 * POST /api/v1/college/onboarding/basic-info
 * Section 1: Basic Information
 */
export const saveBasicInfo = asyncHandler(async (req, res) => {
  const data = basicInfoSchema.parse(req.body);
  const updated = await collegeService.saveBasicInfo(req.user.id, data);

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        updated.basicInfo,
        'Basic information saved successfully.'
      )
    );
});

/**
 * POST /api/v1/college/onboarding/contact-info
 * Section 2: Contact Information
 */
export const saveContactInfo = asyncHandler(async (req, res) => {
  const data = contactInfoSchema.parse(req.body);
  const updated = await collegeService.saveContactInfo(req.user.id, data);

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        updated.contactInfo,
        'Contact information saved successfully.'
      )
    );
});

/**
 * POST /api/v1/college/onboarding/address
 * Section 3: Address Details
 */
export const saveAddress = asyncHandler(async (req, res) => {
  const data = addressSchema.parse(req.body);
  const updated = await collegeService.saveAddress(req.user.id, data);

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        updated.address,
        'Address details saved successfully.'
      )
    );
});

/**
 * POST /api/v1/college/onboarding/representative
 * Section 4: College Representative
 */
export const saveRepresentative = asyncHandler(async (req, res) => {
  const data = representativeSchema.parse(req.body);
  const updated = await collegeService.saveRepresentative(req.user.id, data);

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        updated.representative,
        'Representative details saved successfully.'
      )
    );
});

/**
 * POST /api/v1/college/onboarding/documents
 * Section 5: Documents (with Multer file upload)
 */
export const saveDocuments = asyncHandler(async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'At least one document is required.'
    );
  }

  const updated = await collegeService.saveDocuments(req.user.id, req.files);

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        updated.documents,
        'Documents uploaded successfully.'
      )
    );
});

/**
 * POST /api/v1/college/onboarding/academic-info
 * Section 6: Academic Information
 */
export const saveAcademicInfo = asyncHandler(async (req, res) => {
  const data = academicInfoSchema.parse(req.body);
  const updated = await collegeService.saveAcademicInfo(req.user.id, data);

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        updated.academicInfo,
        'Academic information saved successfully.'
      )
    );
});

// ── Section 7: Verification ──
export const saveVerification = asyncHandler(async (req, res) => {
  // Manual bypass or fallback if needed
  const updated = await collegeService.saveVerification(req.user.id, {
    emailVerified: true,
    mobileVerified: true,
  });

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        updated.verification,
        'Verification completed successfully.'
      )
    );
});

export const sendMobileOtp = asyncHandler(async (req, res) => {
  const result = await collegeService.sendMobileOtp(req.user.id);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, result.message));
});

export const verifyMobileOtp = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  if (!otp) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'OTP is required.');

  const updated = await collegeService.verifyMobileOtp(req.user.id, otp);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, updated.verification, 'Mobile verified successfully.'));
});

/**
 * POST /api/v1/college/onboarding/terms
 * Section 8: Terms & Declaration
 */
export const acceptTerms = asyncHandler(async (req, res) => {
  const data = termsSchema.parse(req.body);
  const updated = await collegeService.acceptTerms(req.user.id, data);

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        {
          status: updated.status,
          onboardingCompleted: updated.onboardingCompleted,
          termsAccepted: updated.termsAccepted,
        },
        'Terms accepted. Your college registration is now under review.'
      )
    );
});

/**
 * GET /api/v1/college/onboarding/progress
 * Get current onboarding progress
 */
export const getProgress = asyncHandler(async (req, res) => {
  const progress = await collegeService.getOnboardingProgress(req.user.id);

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        progress,
        'Onboarding progress retrieved successfully.'
      )
    );
});

/**
 * GET /api/v1/college/data
 * Get full college data
 */
export const getCollegeData = asyncHandler(async (req, res) => {
  const college = await collegeService.getCollegeData(req.user.id);

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        college,
        'College data retrieved successfully.'
      )
    );
});

/**
 * GET /api/v1/college/list
 * Get list of approved colleges for student signup (Public)
 */
export const getCollegeList = asyncHandler(async (req, res) => {
  const colleges = await collegeService.getCollegeList();

  res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        colleges,
        'College list retrieved successfully.'
      )
    );
});
