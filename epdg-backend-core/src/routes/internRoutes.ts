import { Router } from 'express';
import { authMiddleware, roleGuard } from '../middlewares/auth';
import * as InternController from '../controllers/InternController';

const router = Router();

// All intern routes require valid JWT
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Intern
 *   description: Intern dashboard, profile and onboarding
 */

// Dashboard — intern sees tasks, stats, announcements
router.get('/dashboard', roleGuard('intern'), InternController.getDashboard);

// Profile — view and edit
router.get('/profile',   roleGuard('intern'), InternController.getProfile);
router.patch('/profile', roleGuard('intern'), InternController.updateProfile);

// Onboarding — accessible to interns only
router.get('/onboarding',                      roleGuard('intern'), InternController.getOnboarding);
router.patch('/onboarding/:stepId/complete',   roleGuard('intern'), InternController.completeOnboardingStep);

export default router;
