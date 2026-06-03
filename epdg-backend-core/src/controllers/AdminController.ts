import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { AdminService } from '../services/AdminService';

const adminService = new AdminService();

// GET /api/admin/stats
export const getStats = async (req: Request, res: Response) => {
  try {
    const stats = await adminService.getStats();
    res.json({ success: true, data: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, errors: [] });
  }
};

// GET /api/admin/users?role=&status=&search=
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { role, status, search } = req.query as Record<string, string>;
    const users = await adminService.getUsers({ role, status, search });
    res.json({ success: true, data: users });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, errors: [] });
  }
};

// PATCH /api/admin/users/:id  — approve or reject
export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId  = Number(req.params.id);
    const adminId = (req as AuthRequest).user.id;

    if (!['approved', 'rejected'].includes(req.body.status)) {
      res.status(400).json({ success: false, message: 'status must be approved or rejected', errors: [] });
      return;
    }

    const updated = await adminService.updateUserStatus(userId, adminId, req.body);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    const code = err.message === 'User not found' ? 404 : 500;
    res.status(code).json({ success: false, message: err.message, errors: [] });
  }
};

// DELETE /api/admin/users/:id  — soft delete
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId  = Number(req.params.id);
    const adminId = (req as AuthRequest).user.id;

    if (userId === adminId) {
      res.status(400).json({ success: false, message: 'Cannot delete your own account.', errors: [] });
      return;
    }

    await adminService.deleteUser(userId);
    res.json({ success: true, message: 'User deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message, errors: [] });
  }
};

// POST /api/admin/users  — manually create a user
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ success: false, message: 'name, email, password and role are required.', errors: [] });
      return;
    }

    if (!['admin', 'company', 'intern', 'school'].includes(role)) {
      res.status(400).json({ success: false, message: 'Invalid role.', errors: [] });
      return;
    }

    const user = await adminService.createUser({ name, email, password, role });
    res.status(201).json({ success: true, data: user });
  } catch (err: any) {
    const code = err.message?.includes('already') ? 409 : 500;
    res.status(code).json({ success: false, message: err.message, errors: [] });
  }
};
