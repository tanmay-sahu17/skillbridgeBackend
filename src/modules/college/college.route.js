import { Router } from 'express';
import * as collegeController from './college.controller.js';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import upload from '../../config/multer.config.js';

const router = Router();

// Public Routes
router.get('/list', collegeController.getCollegeList);

// All other college routes are protected and require COLLEGE role
router.use(protect, authorize('COLLEGE'));

// ── Section-wise Onboarding Routes ──
router.post('/onboarding/basic-info', collegeController.saveBasicInfo);
router.post('/onboarding/contact-info', collegeController.saveContactInfo);
router.post('/onboarding/address', collegeController.saveAddress);
router.post('/onboarding/representative', collegeController.saveRepresentative);

// Section 5: Documents (with Multer multi-file upload)
router.post(
  '/onboarding/documents',
  upload.fields([
    { name: 'collegeLogo', maxCount: 1 },
    { name: 'affiliationCert', maxCount: 1 },
    { name: 'authorizationLetter', maxCount: 1 },
    { name: 'naacCertificate', maxCount: 1 },
    { name: 'nirfCertificate', maxCount: 1 },
    { name: 'collegeBrochure', maxCount: 1 },
    { name: 'gstCertificate', maxCount: 1 },
    { name: 'otherCertificates', maxCount: 5 },
  ]),
  collegeController.saveDocuments
);

router.post('/onboarding/academic-info', collegeController.saveAcademicInfo);
router.post('/onboarding/verification', collegeController.saveVerification);
router.post('/onboarding/verification/send-mobile-otp', collegeController.sendMobileOtp);
router.post('/onboarding/verification/verify-mobile-otp', collegeController.verifyMobileOtp);
router.post('/onboarding/verification/send-email-otp', collegeController.sendEmailOtp);
router.post('/onboarding/verification/verify-email-otp', collegeController.verifyEmailOtp);
router.post('/onboarding/terms', collegeController.acceptTerms);

// ── Progress & Data Routes ──
router.get('/onboarding/progress', collegeController.getProgress);
router.get('/data', collegeController.getCollegeData);

export default router;
