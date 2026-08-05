import prisma from '../../core/prisma.js';
import AppError from '../../utils/appError.js';
import asyncHandler from '../../utils/asyncHandler.js';

// --------------------------------------------------------
// GIG MANAGER (STUDENT) ACTIONS
// --------------------------------------------------------

/**
 * @desc    Create a new Gig
 * @route   POST /api/v1/gig
 * @access  Private (Student with OPPORTUNITY_PROVIDER or BOTH)
 */
export const createGig = asyncHandler(async (req, res, next) => {
  const { title, description, category, skillsRequired, duration, budget, paymentEnabled } = req.body;

  // The logged-in user must be a Student
  if (!req.user.student) {
    return next(new AppError('Only students can create gigs', 403));
  }

  // Check PlatformRole
  const platformRole = req.user.student.platformRole;
  if (platformRole !== 'OPPORTUNITY_PROVIDER' && platformRole !== 'BOTH') {
    return next(new AppError('Your platform role does not allow creating opportunities', 403));
  }

  const gig = await prisma.gig.create({
    data: {
      title,
      description,
      category,
      skillsRequired: skillsRequired || [],
      duration,
      budget,
      paymentEnabled: paymentEnabled || false,
      status: 'PENDING_APPROVAL', // Goes straight to college for approval
      creatorId: req.user.student.id,
      collegeId: req.user.student.collegeId,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Gig created and sent to college for approval',
    data: gig,
  });
});

/**
 * @desc    Get all Gigs visible to the logged-in user
 * @route   GET /api/v1/gig
 * @access  Private
 */
export const getGigs = asyncHandler(async (req, res, next) => {
  const collegeId = req.user.student?.collegeId || req.user.employerCollege?.id;

  // If internal, must match college. If public, anyone can see.
  const filter = {
    status: 'OPEN',
    OR: [
      { visibility: 'PUBLIC' },
      { visibility: 'INTERNAL', collegeId: collegeId },
    ],
  };

  const gigs = await prisma.gig.findMany({
    where: filter,
    include: {
      creator: {
        select: {
          id: true,
          basicInfo: true,
          gigLevel: true,
          badges: { include: { badge: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    data: gigs,
  });
});

/**
 * @desc    Get details of a single Gig
 * @route   GET /api/v1/gig/:id
 * @access  Private
 */
export const getGigById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const gig = await prisma.gig.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, basicInfo: true, gigLevel: true } },
      resources: true,
      rewards: true,
      tasks: true,
    },
  });

  if (!gig) {
    return next(new AppError('Gig not found', 404));
  }

  res.status(200).json({
    success: true,
    data: gig,
  });
});

/**
 * @desc    Resubmit a Gig after changes requested
 * @route   PATCH /api/v1/gig/:id/resubmit
 * @access  Private (Creator only)
 */
export const resubmitGig = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { title, description, category, skillsRequired, duration, budget } = req.body;

  const gig = await prisma.gig.findUnique({ where: { id } });

  if (!gig) return next(new AppError('Gig not found', 404));
  
  if (gig.creatorId !== req.user.student?.id) {
    return next(new AppError('Unauthorized', 403));
  }

  if (gig.status !== 'CHANGES_REQUESTED') {
    return next(new AppError('Gig is not in a resubmission state', 400));
  }

  const updatedGig = await prisma.gig.update({
    where: { id },
    data: {
      title, description, category, skillsRequired, duration, budget,
      status: 'PENDING_APPROVAL', // Send back to college
      feedback: null, // Clear old feedback
    },
  });

  res.status(200).json({
    success: true,
    message: 'Gig resubmitted for approval',
    data: updatedGig,
  });
});
