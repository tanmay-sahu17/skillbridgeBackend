import { Router } from 'express';
import * as studentController from './student.controller.js';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import upload from '../../config/multer.config.js';

const router = Router();

// All student routes are protected and require STUDENT role
router.use(protect, authorize('STUDENT'));

// ── Section-wise Onboarding Routes ──
router.post('/onboarding/basic-info', studentController.saveBasicInfo);
router.post('/onboarding/contact-info', studentController.saveContactInfo);
router.post('/onboarding/academic-info', studentController.saveAcademicInfo);
router.post('/onboarding/career-profile', studentController.saveCareerProfile);

// Section 5: Portfolio (with optional resume upload)
router.post(
  '/onboarding/portfolio',
  upload.fields([{ name: 'resume', maxCount: 1 }]),
  studentController.savePortfolio
);

// Section 6: Documents
router.post(
  '/onboarding/documents',
  upload.fields([
    { name: 'studentIdCardFront', maxCount: 1 },
    { name: 'studentIdCardBack', maxCount: 1 },
    { name: 'bonafideCert', maxCount: 1 },
    { name: 'feeReceipt', maxCount: 1 },
  ]),
  studentController.saveDocuments
);

router.post('/onboarding/platform-role', studentController.savePlatformRole);
router.post('/onboarding/verification', studentController.saveVerification);
router.post('/onboarding/verification/send-mobile-otp', studentController.sendMobileOtp);
router.post('/onboarding/verification/verify-mobile-otp', studentController.verifyMobileOtp);
router.post('/onboarding/declaration', studentController.saveDeclaration);

// ── Progress & Data Routes ──
router.get('/onboarding/progress', studentController.getProgress);
router.get('/data', studentController.getStudentData);

export default router;
