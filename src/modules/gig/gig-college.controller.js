import prisma from '../../core/prisma.js';
import AppError from '../../utils/appError.js';
import asyncHandler from '../../utils/asyncHandler.js';

// --------------------------------------------------------
// COLLEGE GIG APPROVAL WORKFLOW
// --------------------------------------------------------

/**
 * @desc    Get all gigs created by students in this college
 * @route   GET /api/v1/gig/college/manage
 * @access  Private (College Staff / Admin)
 */
export const getCollegeGigs = asyncHandler(async (req, res, next) => {
  const collegeId = req.user.college?.id || req.user.employerCollege?.id;

  if (!collegeId) {
    return next(new AppError('Unauthorized: Not associated with a college', 403));
  }

  const statusFilter = req.query.status; // e.g., PENDING_APPROVAL

  const gigs = await prisma.gig.findMany({
    where: {
      collegeId,
      ...(statusFilter && { status: statusFilter }),
    },
    include: {
      creator: {
        select: {
          basicInfo: true,
          academicInfo: true,
          gigLevel: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    data: gigs,
  });
});

/**
 * @desc    Approve/Reject/Request Changes for a Gig
 * @route   PATCH /api/v1/gig/college/manage/:id
 * @access  Private (College Staff / Admin)
 */
export const reviewGig = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, feedback } = req.body;
  
  const collegeId = req.user.college?.id || req.user.employerCollege?.id;
  if (!collegeId) {
    return next(new AppError('Unauthorized: Not associated with a college', 403));
  }

  const gig = await prisma.gig.findUnique({ where: { id } });

  if (!gig) return next(new AppError('Gig not found', 404));
  
  if (gig.collegeId !== collegeId) {
    return next(new AppError('Unauthorized: Gig does not belong to your college', 403));
  }

  const validStatuses = ['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'];
  if (!validStatuses.includes(status)) {
    return next(new AppError('Invalid status update', 400));
  }

  // If approved, transition from APPROVED to OPEN automatically or keep as APPROVED.
  // We'll set to OPEN so students can apply.
  const finalStatus = status === 'APPROVED' ? 'OPEN' : status;

  const updatedGig = await prisma.gig.update({
    where: { id },
    data: {
      status: finalStatus,
      feedback: feedback || null, // College leaves snippets or notes here
    },
  });

  res.status(200).json({
    success: true,
    message: `Gig ${finalStatus.toLowerCase()} successfully`,
    data: updatedGig,
  });
});
