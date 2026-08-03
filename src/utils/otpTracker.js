import prisma from '../core/prisma.js';
import { ApiError } from '../core/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';

/**
 * Handles OTP rate limiting and cooldown logic.
 * Call this BEFORE sending an OTP.
 * 
 * @param {string} identifier - Email or mobile number
 * @returns {Promise<void>}
 */
export const checkOtpRateLimit = async (identifier) => {
  let tracker = await prisma.otpTracker.findUnique({
    where: { identifier },
  });

  // If no tracker exists, create one and allow sending OTP
  if (!tracker) {
    await prisma.otpTracker.create({
      data: { identifier, attempts: 1 },
    });
    return;
  }

  // Check if currently under cooldown
  if (tracker.cooldownUntil && new Date() < tracker.cooldownUntil) {
    const remainingMins = Math.ceil((tracker.cooldownUntil.getTime() - Date.now()) / 60000);
    throw new ApiError(
      HTTP_STATUS.TOO_MANY_REQUESTS,
      `Too many attempts. Please try again after ${remainingMins} minutes.`
    );
  }

  // If we reach here and cooldown was in the past, reset it
  if (tracker.cooldownUntil && new Date() > tracker.cooldownUntil) {
    tracker = await prisma.otpTracker.update({
      where: { identifier },
      data: { attempts: 1, cooldownUntil: null },
    });
    return;
  }

  // Check attempts (Max 2 sends: 1 initial + 1 resend)
  // If attempting for the 3rd time (tracker.attempts >= 2), trigger a 30 min cooldown
  if (tracker.attempts >= 2) {
    const cooldownUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 mins from now
    await prisma.otpTracker.update({
      where: { identifier },
      data: { cooldownUntil },
    });
    throw new ApiError(
      HTTP_STATUS.TOO_MANY_REQUESTS,
      `Maximum resend limit reached. Please try again after 30 minutes.`
    );
  }

  // Otherwise, increment attempt
  await prisma.otpTracker.update({
    where: { identifier },
    data: { attempts: tracker.attempts + 1 },
  });
};

/**
 * Resets the OTP tracker after successful verification.
 * Call this AFTER successful verification.
 * 
 * @param {string} identifier - Email or mobile number
 * @returns {Promise<void>}
 */
export const resetOtpTracker = async (identifier) => {
  const tracker = await prisma.otpTracker.findUnique({ where: { identifier } });
  if (tracker) {
    await prisma.otpTracker.update({
      where: { identifier },
      data: { attempts: 0, cooldownUntil: null },
    });
  }
};
