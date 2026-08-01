import { verifyToken } from '../utils/jwt.js';
import { ApiError } from '../core/ApiError.js';
import { HTTP_STATUS } from '../constants/index.js';
import prisma from '../core/prisma.js';

/**
 * Protect routes — verify JWT token and attach user to request
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Access denied. Token missing.')
    );
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return next(
      new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        'Access denied. Token is invalid or expired.'
      )
    );
  }

  // Fetch fresh user from DB
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!user) {
    return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'User not found.'));
  }

  if (!user.isActive) {
    return next(
      new ApiError(
        HTTP_STATUS.FORBIDDEN,
        'Your account has been deactivated. Contact admin.'
      )
    );
  }

  req.user = user;
  next();
};

/**
 * Authorize specific roles — must be used AFTER protect middleware
 * Usage: authorize('COLLEGE', 'ADMIN')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          HTTP_STATUS.FORBIDDEN,
          `Role '${req.user.role}' is not authorized to access this route.`
        )
      );
    }
    next();
  };
};
