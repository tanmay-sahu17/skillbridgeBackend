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
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
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

  // Hardcoded Admin Support
  if (decoded.id === 'admin' && decoded.role === 'ADMIN') {
    req.user = { id: 'admin', role: 'ADMIN', name: 'Super Admin', isActive: true, customRoleId: null };
    return next();
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
      customRoleId: true,
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

/**
 * Dynamic RBAC / ABAC Authorization
 * Usage: checkPermission('/students', 'CREATE')
 */
export const checkPermission = (menuPath, requiredAction) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      // Super admin can do anything
      if (user.role === 'ADMIN' && user.id === 'admin') return next();
      
      const menu = await prisma.menu.findUnique({ where: { path: menuPath } });
      if (!menu) return next(new ApiError(HTTP_STATUS.NOT_FOUND, 'Menu/Resource not found.'));

      // 1. Check User-Level Overrides (ABAC)
      const userPermission = await prisma.userMenuPermission.findUnique({
        where: { userId_menuId: { userId: user.id, menuId: menu.id } }
      });

      if (userPermission) {
        if (userPermission.actions.includes(requiredAction)) return next();
        return next(new ApiError(HTTP_STATUS.FORBIDDEN, `You are explicitly denied from performing ${requiredAction} on this resource.`));
      }

      // 2. Check Role-Level Permissions
      let customRoleId = user.customRoleId;
      
      if (!customRoleId) {
         const baseRole = await prisma.customRole.findFirst({
           where: { name: user.role, collegeId: null }
         });
         if (baseRole) customRoleId = baseRole.id;
      }

      if (customRoleId) {
        const rolePermission = await prisma.roleMenuPermission.findUnique({
          where: { customRoleId_menuId: { customRoleId, menuId: menu.id } }
        });

        if (rolePermission && rolePermission.actions.includes(requiredAction)) {
          return next();
        }
      }

      return next(new ApiError(HTTP_STATUS.FORBIDDEN, `You do not have permission to perform ${requiredAction} on this resource.`));

    } catch (error) {
      next(error);
    }
  };
};
