import { Router } from "express";
import { authMiddleware, roleGuard } from "../middlewares/auth";
import * as SchoolController from "../controllers/SchoolController";
import * as PlacementController from "../controllers/PlacementController"
import * as NotificationController from "../controllers/NotificationController"
import * as ProfileController from "../controllers/ProfileController";

const router = Router();
router.use(authMiddleware);

//school dashboard home routes
router.get("/:schoolId/stats", SchoolController.getStats);

router.get("/:schoolId/pipeline", SchoolController.getPipeline);

router.get(
  "/:schoolId/completions/recent",
  SchoolController.getRecentCompletions,
);

router.get("/:schoolId/pending-actions", SchoolController.getPendingActions);

//student management routes

router.get("/:schoolId/students", SchoolController.getStudents);

router.get("/:schoolId/students/:studentId", SchoolController.getStudentById);

//register students

router.post("/:schoolId/students/register", SchoolController.registerStudent);
router.post("/:schoolId/students/bulk", SchoolController.bulkRegisterStudents);
router.get("/:schoolId/students/submissions", SchoolController.getSubmissions);

// Student progress reports
router.get(
  "/:schoolId/students/:studentId/progress",
  SchoolController.getStudentProgress,
);
router.get("/:schoolId/cohort/summary", SchoolController.getCohortSummary);

// Placement Pipeline

router.get(
  "/:schoolId/placements/pipeline",
  PlacementController.getPipelineBoard,
);
router.get(
  "/:schoolId/placements/pipeline/stats",
  PlacementController.getPipelineStats,
);

// Notifications & Alerts

router.get('/:schoolId/notifications', NotificationController.getNotifications);

router.patch('/:schoolId/notifications/read-all', NotificationController.markAllAsRead); 

router.patch('/:schoolId/notifications/:notifId', NotificationController.markAsRead);

router.delete('/:schoolId/notifications/:notifId', NotificationController.deleteNotification);

// School Profile & Settings

router.get('/:schoolId/profile', ProfileController.getProfile);

router.patch('/:schoolId/profile/password', ProfileController.changePassword);

router.patch('/:schoolId/profile', ProfileController.updateProfile);

export default router;
