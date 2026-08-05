import prisma from '../../core/prisma.js';
import AppError from '../../utils/appError.js';
import asyncHandler from '../../utils/asyncHandler.js';

/**
 * @desc    Create a new Task/Milestone for a Gig
 * @route   POST /api/v1/gig/:gigId/tasks
 * @access  Private (Gig Creator)
 */
export const createTask = asyncHandler(async (req, res, next) => {
  const { gigId } = req.params;
  const { title, description, points, assigneeId } = req.body;

  const gig = await prisma.gig.findUnique({ where: { id: gigId } });
  if (!gig || gig.creatorId !== req.user.student?.id) {
    return next(new AppError('Unauthorized', 403));
  }

  const task = await prisma.gigTask.create({
    data: {
      gigId,
      title,
      description,
      points: points || 10,
      assigneeId,
    },
  });

  res.status(201).json({
    success: true,
    data: task,
  });
});

/**
 * @desc    Update a task status (Done/In Progress)
 * @route   PATCH /api/v1/gig/:gigId/tasks/:taskId
 * @access  Private (Gig Creator or Assignee)
 */
export const updateTaskStatus = asyncHandler(async (req, res, next) => {
  const { gigId, taskId } = req.params;
  const { status } = req.body;
  const userId = req.user.student?.id;

  const task = await prisma.gigTask.findUnique({ where: { id: taskId }, include: { gig: true } });
  if (!task) return next(new AppError('Task not found', 404));

  const isCreator = task.gig.creatorId === userId;
  const isAssignee = task.assigneeId === userId;

  if (!isCreator && !isAssignee) {
    return next(new AppError('Unauthorized', 403));
  }

  const updatedTask = await prisma.gigTask.update({
    where: { id: taskId },
    data: {
      status,
      completedAt: status === 'DONE' ? new Date() : null,
    },
  });

  // Gamification: If marked DONE, we can award XP/Points to the assignee here.
  if (status === 'DONE' && task.assigneeId && task.status !== 'DONE') {
    await prisma.student.update({
      where: { id: task.assigneeId },
      data: {
        gigXp: { increment: task.points },
        gigPoints: { increment: task.points },
      },
    });
  }

  res.status(200).json({
    success: true,
    data: updatedTask,
  });
});
