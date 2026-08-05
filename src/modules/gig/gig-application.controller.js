import prisma from '../../core/prisma.js';
import AppError from '../../utils/appError.js';
import asyncHandler from '../../utils/asyncHandler.js';

// --------------------------------------------------------
// GIG APPLICATION (STUDENT APPLYING)
// --------------------------------------------------------

/**
 * @desc    Apply to an Open Gig
 * @route   POST /api/v1/gig/:id/apply
 * @access  Private (Student)
 */
export const applyToGig = asyncHandler(async (req, res, next) => {
  const gigId = req.params.id;
  const { coverLetter, resumeUrl } = req.body;
  const applicantId = req.user.student?.id;

  if (!applicantId) return next(new AppError('Only students can apply to gigs', 403));

  const gig = await prisma.gig.findUnique({ where: { id: gigId } });
  
  if (!gig) return next(new AppError('Gig not found', 404));
  if (gig.status !== 'OPEN') return next(new AppError('This gig is not open for applications', 400));
  if (gig.creatorId === applicantId) return next(new AppError('You cannot apply to your own gig', 400));

  // Visibility check
  if (gig.visibility === 'INTERNAL' && gig.collegeId !== req.user.student.collegeId) {
    return next(new AppError('This gig is only open to students of the hosting college', 403));
  }

  // Check if already applied
  const existingApp = await prisma.gigApplication.findUnique({
    where: { gigId_applicantId: { gigId, applicantId } }
  });

  if (existingApp) return next(new AppError('You have already applied to this gig', 400));

  const application = await prisma.gigApplication.create({
    data: {
      gigId,
      applicantId,
      coverLetter,
      resumeUrl,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Applied to gig successfully',
    data: application,
  });
});

// --------------------------------------------------------
// APPLICANT MANAGEMENT (GIG MANAGER & COLLEGE)
// --------------------------------------------------------

/**
 * @desc    Get all applicants for a specific Gig
 * @route   GET /api/v1/gig/:id/applicants
 * @access  Private (Gig Creator or College)
 */
export const getApplicants = asyncHandler(async (req, res, next) => {
  const gigId = req.params.id;

  const gig = await prisma.gig.findUnique({ where: { id: gigId } });
  if (!gig) return next(new AppError('Gig not found', 404));

  // Check access: Must be creator OR college admin of that college
  const isCreator = req.user.student?.id === gig.creatorId;
  const isCollege = req.user.college?.id === gig.collegeId || req.user.employerCollege?.id === gig.collegeId;

  if (!isCreator && !isCollege) {
    return next(new AppError('Unauthorized to view applicants', 403));
  }

  const applications = await prisma.gigApplication.findMany({
    where: { gigId },
    include: {
      applicant: {
        select: {
          id: true,
          basicInfo: true,
          academicInfo: true,
          portfolio: true,
          gigLevel: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    data: applications,
  });
});

/**
 * @desc    Update applicant status (Select, Reject, Interview, etc.)
 * @route   PATCH /api/v1/gig/:gigId/applicants/:applicantId
 * @access  Private (Gig Creator)
 */
export const updateApplicantStatus = asyncHandler(async (req, res, next) => {
  const { gigId, applicantId } = req.params;
  const { status, notes } = req.body;

  const gig = await prisma.gig.findUnique({ where: { id: gigId } });
  if (!gig || gig.creatorId !== req.user.student?.id) {
    return next(new AppError('Unauthorized', 403));
  }

  const validStatuses = ['UNDER_REVIEW', 'INTERVIEW_SCHEDULED', 'SELECTED', 'REJECTED'];
  if (!validStatuses.includes(status)) {
    return next(new AppError('Invalid application status', 400));
  }

  const application = await prisma.gigApplication.update({
    where: { gigId_applicantId: { gigId, applicantId } },
    data: {
      status,
      ...(notes && { notes }), // Update internal notes if provided
    },
  });

  res.status(200).json({
    success: true,
    message: `Applicant status updated to ${status}`,
    data: application,
  });
});
