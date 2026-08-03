import asyncHandler from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../core/ApiResponse.js';
import { ApiError } from '../../core/ApiError.js';
import { HTTP_STATUS } from '../../constants/index.js';
import * as studentService from './student.service.js';
import {
  studentBasicInfoSchema,
  studentContactInfoSchema,
  studentAcademicInfoSchema,
  studentCareerProfileSchema,
  studentPortfolioSchema,
  studentPlatformRoleSchema,
  studentDeclarationSchema,
} from './student.validation.js';

export const saveBasicInfo = asyncHandler(async (req, res) => {
  const data = studentBasicInfoSchema.parse(req.body);
  const updated = await studentService.saveBasicInfo(req.user.id, data);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, updated.basicInfo, 'Basic info saved successfully.')
  );
});

export const saveContactInfo = asyncHandler(async (req, res) => {
  const data = studentContactInfoSchema.parse(req.body);
  const updated = await studentService.saveContactInfo(req.user.id, data);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, updated.contactInfo, 'Contact info saved successfully.')
  );
});

export const saveAcademicInfo = asyncHandler(async (req, res) => {
  const data = studentAcademicInfoSchema.parse(req.body);
  const updated = await studentService.saveAcademicInfo(req.user.id, data);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, updated.academicInfo, 'Academic info saved successfully.')
  );
});

export const saveCareerProfile = asyncHandler(async (req, res) => {
  const data = studentCareerProfileSchema.parse(req.body);
  const updated = await studentService.saveCareerProfile(req.user.id, data);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, updated.careerProfile, 'Career profile saved successfully.')
  );
});

export const savePortfolio = asyncHandler(async (req, res) => {
  let parsedBody = req.body;
  if (req.body.data) {
    // Handling case where data is sent as JSON string in form-data
    parsedBody = JSON.parse(req.body.data);
  }

  const data = studentPortfolioSchema.parse(parsedBody);
  const file = req.files?.resume?.[0] || null;
  const updated = await studentService.savePortfolio(req.user.id, data, file);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, updated.portfolio, 'Portfolio saved successfully.')
  );
});

export const saveDocuments = asyncHandler(async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'At least one document is required.');
  }

  const updated = await studentService.saveDocuments(req.user.id, req.files);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, updated.documents, 'Documents uploaded successfully.')
  );
});

export const savePlatformRole = asyncHandler(async (req, res) => {
  const data = studentPlatformRoleSchema.parse(req.body);
  const updated = await studentService.savePlatformRole(req.user.id, data);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, { platformRole: updated.platformRole }, 'Platform role saved successfully.')
  );
});

export const saveVerification = asyncHandler(async (req, res) => {
  // Manual bypass or fallback
  const updated = await studentService.saveVerification(req.user.id, {
    emailVerified: true,
    mobileVerified: true,
  });

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, updated.verification, 'Verification saved successfully.')
  );
});

export const sendMobileOtp = asyncHandler(async (req, res) => {
  const result = await studentService.sendMobileOtp(req.user.id);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, null, result.message));
});

export const verifyMobileOtp = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  if (!otp) throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'OTP is required.');

  const updated = await studentService.verifyMobileOtp(req.user.id, otp);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(HTTP_STATUS.OK, updated.verification, 'Mobile verified successfully.'));
});

export const saveDeclaration = asyncHandler(async (req, res) => {
  const data = studentDeclarationSchema.parse(req.body);
  const updated = await studentService.saveDeclaration(req.user.id, data);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      { status: updated.status, onboardingCompleted: updated.onboardingCompleted },
      'Declaration submitted. Your profile is pending college verification.'
    )
  );
});

export const getProgress = asyncHandler(async (req, res) => {
  const progress = await studentService.getOnboardingProgress(req.user.id);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, progress, 'Onboarding progress retrieved successfully.')
  );
});

export const getStudentData = asyncHandler(async (req, res) => {
  const student = await studentService.getStudentData(req.user.id);

  res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, student, 'Student data retrieved successfully.')
  );
});
