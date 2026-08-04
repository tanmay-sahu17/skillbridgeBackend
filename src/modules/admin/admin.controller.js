import jwt from 'jsonwebtoken';
import asyncHandler from '../../utils/asyncHandler.js';
import prisma from '../../core/prisma.js';

// ── Admin Auth ──
export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@skillbridge.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (email !== adminEmail || password !== adminPassword) {
    return res.status(401).json({ success: false, message: 'Invalid Admin Credentials' });
  }

  const token = jwt.sign(
    { id: 'admin', role: 'ADMIN' },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.status(200).json({ success: true, token, message: 'Admin logged in successfully' });
});

// ── Menu Management ──
export const createMenu = asyncHandler(async (req, res) => {
  const { title, path, icon, parentId, order } = req.body;
  
  const existingMenu = await prisma.menu.findUnique({ where: { path } });
  if (existingMenu) {
    return res.status(400).json({ success: false, message: 'Menu path already exists' });
  }

  const menu = await prisma.menu.create({
    data: { title, path, icon, parentId, order: order || 0 }
  });

  res.status(201).json({ success: true, data: menu });
});

export const getMenus = asyncHandler(async (req, res) => {
  const menus = await prisma.menu.findMany({ orderBy: { order: 'asc' } });
  res.status(200).json({ success: true, data: menus });
});

// ── Base Role Permission Assignment ──
export const assignBaseRolePermissions = asyncHandler(async (req, res) => {
  const { roleName, menuId, actions } = req.body; 
  // roleName can be "STUDENT", "COLLEGE", "RECRUITER"
  
  // Find or create the base CustomRole template (collegeId is null)
  let customRole = await prisma.customRole.findFirst({
    where: { name: roleName, collegeId: null }
  });

  if (!customRole) {
    customRole = await prisma.customRole.create({
      data: { name: roleName, collegeId: null, description: `Base role for ${roleName}` }
    });
  }

  // Upsert the RoleMenuPermission
  const roleMenuPermission = await prisma.roleMenuPermission.upsert({
    where: {
      customRoleId_menuId: {
        customRoleId: customRole.id,
        menuId: menuId
      }
    },
    update: { actions },
    create: {
      customRoleId: customRole.id,
      menuId: menuId,
      actions
    }
  });

  res.status(200).json({ success: true, data: roleMenuPermission });
});
