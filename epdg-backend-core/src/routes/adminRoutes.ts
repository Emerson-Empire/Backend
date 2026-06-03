import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { roleGuard } from '../middlewares/auth';
import * as AdminController from '../controllers/AdminController';

const router = Router();

// All admin routes require a valid JWT + admin role
router.use(authMiddleware);
router.use(roleGuard('admin'));

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management endpoints
 */

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get platform statistics for admin dashboard
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats object
 */
router.get('/stats', AdminController.getStats);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List all users with optional filters
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [admin, company, intern, school] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, approved, rejected, unverified] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Array of users
 */
router.get('/users', AdminController.getUsers);

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     summary: Manually create a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post('/users', AdminController.createUser);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   patch:
 *     summary: Approve or reject a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *               rejection_reason:
 *                 type: string
 *               department:
 *                 type: string
 *               mentor:
 *                 type: string
 */
router.patch('/users/:id', AdminController.updateUser);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Soft-delete a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/users/:id', AdminController.deleteUser);

export default router;
