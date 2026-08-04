import asyncHandler from '../../utils/asyncHandler.js';
import prisma from '../../core/prisma.js';
import bcrypt from 'bcryptjs';

// ── 1. Create Custom Role for College ──
export const createCustomRole = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.id; // User must be a COLLEGE

  const college = await prisma.college.findUnique({ where: { userId } });
  if (!college) return res.status(404).json({ success: false, message: 'College profile not found' });

  const existingRole = await prisma.customRole.findUnique({
    where: { name_collegeId: { name, collegeId: college.id } }
  });

  if (existingRole) {
    return res.status(400).json({ success: false, message: 'Role with this name already exists in your college' });
  }

  const role = await prisma.customRole.create({
    data: { name, description, collegeId: college.id }
  });

  res.status(201).json({ success: true, data: role });
});

// ── 2. Assign Permissions to Custom Role ──
export const assignRolePermissions = asyncHandler(async (req, res) => {
  const { customRoleId, menuId, actions } = req.body;
  const userId = req.user.id;

  const college = await prisma.college.findUnique({ where: { userId } });
  
  // Verify the custom role belongs to this college
  const customRole = await prisma.customRole.findFirst({
    where: { id: customRoleId, collegeId: college.id }
  });
  if (!customRole) return res.status(404).json({ success: false, message: 'Custom role not found for this college' });

  // Security Check: Ensure the college itself has these permissions!
  // Find the Base COLLEGE role template
  const baseCollegeRole = await prisma.customRole.findFirst({ where: { name: 'COLLEGE', collegeId: null } });
  
  const basePermission = await prisma.roleMenuPermission.findFirst({
    where: { customRoleId: baseCollegeRole?.id, menuId }
  });

  if (!basePermission) {
    return res.status(403).json({ success: false, message: 'Your college does not have access to this menu.' });
  }

  // Check if requested actions are a subset of the base permissions
  const hasInvalidAction = actions.some(action => !basePermission.actions.includes(action));
  if (hasInvalidAction) {
    return res.status(403).json({ success: false, message: 'You cannot delegate permissions you do not possess.' });
  }

  const roleMenuPermission = await prisma.roleMenuPermission.upsert({
    where: { customRoleId_menuId: { customRoleId, menuId } },
    update: { actions },
    create: { customRoleId, menuId, actions }
  });

  res.status(200).json({ success: true, data: roleMenuPermission });
});

// ── 3. Create College Staff ──
export const createCollegeStaff = asyncHandler(async (req, res) => {
  const { name, email, password, customRoleId } = req.body;
  const userId = req.user.id;

  const college = await prisma.college.findUnique({
    where: { userId },
    include: { basicInfo: true }
  });

  // Verify customRole belongs to college
  const customRole = await prisma.customRole.findFirst({
    where: { id: customRoleId, collegeId: college.id }
  });
  if (!customRole) return res.status(400).json({ success: false, message: 'Invalid role selected.' });

  // Domain Verification
  const domain = college.basicInfo?.domain;
  if (!domain) return res.status(400).json({ success: false, message: 'College domain is not verified/setup yet.' });

  const staffDomain = email.split('@')[1];
  if (staffDomain !== domain) {
    return res.status(400).json({ success: false, message: `Staff email must end with @${domain}` });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return res.status(400).json({ success: false, message: 'Email already in use' });

  const hashedPassword = await bcrypt.hash(password, 10);

  const staff = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'COLLEGE_STAFF',
      customRoleId,
      collegeStaffId: college.id, // Linking to the employer college
      isEmailVerified: true // Assuming staff created by admin are auto-verified
    }
  });

  // Remove password from response
  staff.password = undefined;

  res.status(201).json({ success: true, data: staff });
});

// ── 4. Set User-Level Override (ABAC) ──
export const setUserOverridePermission = asyncHandler(async (req, res) => {
  const { staffUserId, menuId, actions } = req.body;
  const userId = req.user.id;

  const college = await prisma.college.findUnique({ where: { userId } });

  // Verify staff belongs to this college
  const staff = await prisma.user.findFirst({
    where: { id: staffUserId, collegeStaffId: college.id }
  });
  if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found.' });

  // Security Check: Ensure college has these permissions
  const baseCollegeRole = await prisma.customRole.findFirst({ where: { name: 'COLLEGE', collegeId: null } });
  const basePermission = await prisma.roleMenuPermission.findFirst({
    where: { customRoleId: baseCollegeRole?.id, menuId }
  });

  if (!basePermission) {
    return res.status(403).json({ success: false, message: 'Your college does not have access to this menu.' });
  }

  const hasInvalidAction = actions.some(action => !basePermission.actions.includes(action));
  if (hasInvalidAction) {
    return res.status(403).json({ success: false, message: 'You cannot delegate permissions you do not possess.' });
  }

  const userMenuPermission = await prisma.userMenuPermission.upsert({
    where: { userId_menuId: { userId: staffUserId, menuId } },
    update: { actions },
    create: { userId: staffUserId, menuId, actions }
  });

  res.status(200).json({ success: true, data: userMenuPermission });
});
