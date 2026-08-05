import express from 'express';
import { protect } from '../../middlewares/auth.middleware.js';
import * as gigController from './gig.controller.js';
import * as gigCollegeController from './gig-college.controller.js';
import * as gigApplicationController from './gig-application.controller.js';
import * as gigTaskController from './gig-task.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as gigSchema from './gig.validation.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

router.route('/')
  .post(validate(gigSchema.createGigSchema), gigController.createGig)
  .get(gigController.getGigs);

router.route('/:id')
  .get(gigController.getGigById);

router.route('/:id/resubmit')
  .patch(validate(gigSchema.resubmitGigSchema), gigController.resubmitGig);

// College Workflow Routes
router.route('/college/manage')
  .get(gigCollegeController.getCollegeGigs);

router.route('/college/manage/:id')
  .patch(validate(gigSchema.reviewGigSchema), gigCollegeController.reviewGig);

// Application Routes
router.route('/:id/apply')
  .post(validate(gigSchema.applyToGigSchema), gigApplicationController.applyToGig);

router.route('/:id/applicants')
  .get(gigApplicationController.getApplicants);

router.route('/:gigId/applicants/:applicantId')
  .patch(validate(gigSchema.updateApplicantStatusSchema), gigApplicationController.updateApplicantStatus);

// Task (Contribution) Routes
router.route('/:gigId/tasks')
  .post(validate(gigSchema.createTaskSchema), gigTaskController.createTask);

router.route('/:gigId/tasks/:taskId')
  .patch(validate(gigSchema.updateTaskStatusSchema), gigTaskController.updateTaskStatus);

export default router;
