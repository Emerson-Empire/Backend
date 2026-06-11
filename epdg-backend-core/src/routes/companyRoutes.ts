import { Router } from 'express';
import { authMiddleware, roleGuard } from '../middlewares/auth';
import * as CompanyController from '../controllers/CompanyController';

const router = Router();

router.use(authMiddleware);
router.use(roleGuard('company'));

/**
 * @swagger
 * tags:
 *   name: Company
 *   description: Company management endpoints
 */

// ─── Dashboard ───────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/company/{companyId}/stats:
 *   get:
 *     summary: Get dashboard stats
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Dashboard stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     activeInterns: { type: integer }
 *                     openSlots: { type: integer }
 *                     pendingApplications: { type: integer }
 *                     pendingReviews: { type: integer }
 */
router.get('/:companyId/stats', CompanyController.getStats);

/**
 * @swagger
 * /api/company/{companyId}/interns:
 *   get:
 *     summary: Get active interns (dashboard list)
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 5 }
 *     responses:
 *       200:
 *         description: Array of intern summaries
 */
router.get('/:companyId/interns', CompanyController.getActiveInterns);

/**
 * @swagger
 * /api/company/{companyId}/sessions/upcoming:
 *   get:
 *     summary: Get upcoming sessions for dashboard
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 3 }
 *     responses:
 *       200:
 *         description: Array of upcoming sessions
 */
router.get('/:companyId/sessions/upcoming', CompanyController.getUpcomingSessions);

/**
 * @swagger
 * /api/company/{companyId}/feedback/recent:
 *   get:
 *     summary: Get recent feedback for dashboard
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 2 }
 *     responses:
 *       200:
 *         description: Array of recent feedback
 */
router.get('/:companyId/feedback/recent', CompanyController.getRecentFeedback);

// ─── Interns (full list + detail) ────────────────────────────────────────

/**
 * @swagger
 * /api/company/{companyId}/interns/all:
 *   get:
 *     summary: Get all interns with optional filters
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: dept
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Array of intern objects
 */
router.get('/:companyId/interns/all', CompanyController.getAllInterns);

/**
 * @swagger
 * /api/company/{companyId}/interns/{internId}:
 *   get:
 *     summary: Get full detail for one intern
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: internId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Intern detail object
 *       404:
 *         description: Intern not found
 */
router.get('/:companyId/interns/:internId', CompanyController.getInternDetail);

// ─── Slots ───────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/company/{companyId}/slots:
 *   get:
 *     summary: Get all internship slots
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Array of slots
 */
router.get('/:companyId/slots', CompanyController.getSlots);

/**
 * @swagger
 * /api/company/{companyId}/slots:
 *   post:
 *     summary: Create a new internship slot
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, department]
 *             properties:
 *               title: { type: string }
 *               department: { type: string }
 *               description: { type: string }
 *               duration: { type: integer }
 *               stipend: { type: number }
 *               isRemote: { type: boolean }
 *               deadline: { type: string, format: date }
 *               maxSlots: { type: integer }
 *     responses:
 *       201:
 *         description: Created slot
 */
router.post('/:companyId/slots', CompanyController.createSlot);

/**
 * @swagger
 * /api/company/{companyId}/slots/{slotId}:
 *   patch:
 *     summary: Update a slot (any subset of fields)
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: slotId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               department: { type: string }
 *               description: { type: string }
 *               duration: { type: integer }
 *               stipend: { type: number }
 *               isRemote: { type: boolean }
 *               deadline: { type: string, format: date }
 *               maxSlots: { type: integer }
 *               status: { type: string, enum: [draft, open, closed, filled] }
 *     responses:
 *       200:
 *         description: Updated slot
 */
router.patch('/:companyId/slots/:slotId', CompanyController.updateSlot);

// ─── Applications ────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/company/{companyId}/applications:
 *   get:
 *     summary: Get all applications with optional status filter
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, shortlisted, accepted, rejected] }
 *     responses:
 *       200:
 *         description: Array of applications
 */
router.get('/:companyId/applications', CompanyController.getApplications);

/**
 * @swagger
 * /api/company/{companyId}/applications/{appId}/status:
 *   patch:
 *     summary: Update application status
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: appId
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
 *                 enum: [shortlisted, accepted, rejected]
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated application
 */
router.patch('/:companyId/applications/:appId/status', CompanyController.updateApplicationStatus);

// ─── Tasks ───────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/company/{companyId}/tasks:
 *   get:
 *     summary: Get all tasks with optional filters
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: internName
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Array of tasks with overdue flag
 */
router.get('/:companyId/tasks', CompanyController.getTasks);

/**
 * @swagger
 * /api/company/{companyId}/tasks:
 *   post:
 *     summary: Create a new task for an intern
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, assignedTo, dueDate]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               assignedTo: { type: integer }
 *               priority: { type: string, enum: [low, normal, urgent] }
 *               dueDate: { type: string, format: date-time }
 *               points: { type: integer }
 *     responses:
 *       201:
 *         description: Created task
 */
router.post('/:companyId/tasks', CompanyController.createTask);

/**
 * @swagger
 * /api/company/{companyId}/tasks/{taskId}:
 *   patch:
 *     summary: Update a task (any subset of fields)
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               priority: { type: string, enum: [low, normal, urgent] }
 *               status: { type: string, enum: [pending, in_progress, review, done] }
 *               due_date: { type: string, format: date-time }
 *               points: { type: integer }
 *     responses:
 *       200:
 *         description: Updated task
 */
router.patch('/:companyId/tasks/:taskId', CompanyController.updateTask);

// ─── Submissions ───────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/company/{companyId}/submissions:
 *   get:
 *     summary: List all submissions with optional status filter
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path, name: companyId, required: true, schema: { type: integer }
 *       - in: query, name: status, schema: { type: string, enum: [submitted, under_review, approved, rejected] }
 *     responses:
 *       200:
 *         description: Array of submission objects
 */
router.get('/:companyId/submissions', CompanyController.getSubmissions);

/**
 * @swagger
 * /api/company/{companyId}/submissions/{subId}/review:
 *   patch:
 *     summary: Approve or reject a submission
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path, name: companyId, required: true, schema: { type: integer }
 *       - in: path, name: subId, required: true, schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status, reviewerComment]
 *             properties:
 *               status: { type: string, enum: [approved, rejected] }
 *               reviewerComment: { type: string }
 *     responses:
 *       200:
 *         description: Updated submission
 */
router.patch('/:companyId/submissions/:subId/review', CompanyController.reviewSubmission);

// ─── Sessions ──────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/company/{companyId}/sessions:
 *   get:
 *     summary: List all sessions with optional status filter
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path, name: companyId, required: true, schema: { type: integer }
 *       - in: query, name: status, schema: { type: string, enum: [scheduled, upcoming, past, cancelled, rescheduled] }
 *     responses:
 *       200:
 *         description: Array of session objects
 */
router.get('/:companyId/sessions', CompanyController.getSessions);

/**
 * @swagger
 * /api/company/{companyId}/sessions:
 *   post:
 *     summary: Schedule a new session
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path, name: companyId, required: true, schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [internId, mentorId, date, topic]
 *             properties:
 *               internId: { type: integer }
 *               mentorId: { type: integer }
 *               date: { type: string, format: date }
 *               time: { type: string }
 *               topic: { type: string }
 *               duration: { type: integer }
 *               meetingLink: { type: string }
 *     responses:
 *       201:
 *         description: Created session
 */
router.post('/:companyId/sessions', CompanyController.createSession);

/**
 * @swagger
 * /api/company/{companyId}/sessions/{sessionId}/status:
 *   patch:
 *     summary: Confirm, reschedule, or cancel a session
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path, name: companyId, required: true, schema: { type: integer }
 *       - in: path, name: sessionId, required: true, schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [confirmed, rescheduled, cancelled] }
 *               newDate: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Updated session
 */
router.patch('/:companyId/sessions/:sessionId/status', CompanyController.updateSessionStatus);

// ─── Analytics ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/company/{companyId}/analytics/departments:
 *   get:
 *     summary: Per-department summary stats
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path, name: companyId, required: true, schema: { type: integer }
 *     responses:
 *       200:
 *         description: Array of department stat objects
 */
router.get('/:companyId/analytics/departments', CompanyController.getDepartmentAnalytics);

/**
 * @swagger
 * /api/company/{companyId}/analytics/tasks-by-week:
 *   get:
 *     summary: Task completion counts by week for past 4 weeks
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path, name: companyId, required: true, schema: { type: integer }
 *     responses:
 *       200:
 *         description: Array of week / taskCount objects
 */
router.get('/:companyId/analytics/tasks-by-week', CompanyController.getTasksByWeek);

/**
 * @swagger
 * /api/company/{companyId}/analytics/performance:
 *   get:
 *     summary: Intern performance table data
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path, name: companyId, required: true, schema: { type: integer }
 *     responses:
 *       200:
 *         description: Array of intern performance objects
 */
router.get('/:companyId/analytics/performance', CompanyController.getPerformanceAnalytics);

// ─── Feedback ──────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/company/{companyId}/feedback:
 *   get:
 *     summary: List all mentor feedback with weekly averages
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path, name: companyId, required: true, schema: { type: integer }
 *     responses:
 *       200:
 *         description: Feedback array + weeklyAverages
 */
router.get('/:companyId/feedback', CompanyController.getFeedback);

/**
 * @swagger
 * /api/company/{companyId}/feedback:
 *   post:
 *     summary: Submit mentor feedback for an intern (duplicate week prevented)
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path, name: companyId, required: true, schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [internId, week, rating, comment]
 *             properties:
 *               internId: { type: integer }
 *               week: { type: integer }
 *               rating: { type: integer, min: 1, max: 5 }
 *               comment: { type: string }
 *     responses:
 *       201:
 *         description: Created feedback
 *       409:
 *         description: Duplicate feedback for this week
 */
router.post('/:companyId/feedback', CompanyController.createFeedback);

/**
 * @swagger
 * /api/company/{companyId}/feedback/intern-to-mentor:
 *   get:
 *     summary: Ratings submitted by interns about their mentors
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path, name: companyId, required: true, schema: { type: integer }
 *       - in: query, name: mentorId, schema: { type: integer }
 *     responses:
 *       200:
 *         description: Array of feedback objects
 */
router.get('/:companyId/feedback/intern-to-mentor', CompanyController.getInternToMentorFeedback);

// ─── Settings ──────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/company/{companyId}/profile:
 *   get:
 *     summary: Get full company profile
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path, name: companyId, required: true, schema: { type: integer }
 *     responses:
 *       200:
 *         description: Company profile object
 */
router.get('/:companyId/profile', CompanyController.getCompanyProfile);

/**
 * @swagger
 * /api/company/{companyId}/profile:
 *   patch:
 *     summary: Update company profile fields
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path, name: companyId, required: true, schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               logo: { type: string }
 *               about: { type: string }
 *               industry: { type: string }
 *               size: { type: integer }
 *               website: { type: string }
 *               coordinator: { type: object, properties: { name: { type: string }, phone: { type: string }, email: { type: string } } }
 *     responses:
 *       200:
 *         description: Updated profile
 */
router.patch('/:companyId/profile', CompanyController.updateCompanyProfile);

/**
 * @swagger
 * /api/company/{companyId}/mentors:
 *   get:
 *     summary: List all mentors for this company
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path, name: companyId, required: true, schema: { type: integer }
 *     responses:
 *       200:
 *         description: Array of mentor objects
 */
router.get('/:companyId/mentors', CompanyController.getMentors);

/**
 * @swagger
 * /api/company/{companyId}/mentors:
 *   post:
 *     summary: Add a new mentor to the company
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path, name: companyId, required: true, schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, role, email]
 *             properties:
 *               name: { type: string }
 *               role: { type: string }
 *               email: { type: string }
 *     responses:
 *       201:
 *         description: Created mentor
 */
router.post('/:companyId/mentors', CompanyController.addMentor);

/**
 * @swagger
 * /api/company/{companyId}/mentors/{mentorId}:
 *   delete:
 *     summary: Remove a mentor (soft delete, does not delete account)
 *     tags: [Company]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path, name: companyId, required: true, schema: { type: integer }
 *       - in: path, name: mentorId, required: true, schema: { type: integer }
 *     responses:
 *       200:
 *         description: Mentor removed
 */
router.delete('/:companyId/mentors/:mentorId', CompanyController.removeMentor);

export default router;
