import { Router } from "express";

import {
  createQualificationController,
  getQualificationsController,
  getQualificationByIdController,
  updateQualificationController,
  changeQualificationStatusController,
  startQualificationAttemptController,
  resumeQualificationAttemptController,
  pauseQualificationAttemptController,
  submitQualificationAnswerController,
  submitQualificationAttemptController,
  getQualificationAttemptController,
  getMyQualificationAttemptsController,
  getMyProjectAssignmentsController,
} from "../controllers/qualification.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// ============================================================
// QUALIFICATION MANAGEMENT
// ============================================================

// Create qualification
// POST /api/qualifications
router.post(
  "/",
  authenticate,
  createQualificationController
);

// Get qualifications
// GET /api/qualifications
router.get(
  "/",
  authenticate,
  getQualificationsController
);

// Get my project assignments
// GET /api/qualifications/my/project-assignments
router.get(
  "/my/project-assignments",
  authenticate,
  getMyProjectAssignmentsController
);

// Get my qualification attempts
// GET /api/qualifications/my/attempts
router.get(
  "/my/attempts",
  authenticate,
  getMyQualificationAttemptsController
);

// Get qualification by ID
// GET /api/qualifications/:qualificationId
router.get(
  "/:qualificationId",
  authenticate,
  getQualificationByIdController
);

// Update qualification
// PATCH /api/qualifications/:qualificationId
router.patch(
  "/:qualificationId",
  authenticate,
  updateQualificationController
);

// Change qualification status
// PATCH /api/qualifications/:qualificationId/status
router.patch(
  "/:qualificationId/status",
  authenticate,
  changeQualificationStatusController
);

// ============================================================
// QUALIFICATION ATTEMPTS
// ============================================================

// Start qualification
// POST /api/qualifications/:qualificationId/start
router.post(
  "/:qualificationId/start",
  authenticate,
  startQualificationAttemptController
);

// Resume attempt
// POST /api/qualifications/attempts/:attemptId/resume
router.post(
  "/attempts/:attemptId/resume",
  authenticate,
  resumeQualificationAttemptController
);

// Pause attempt
// POST /api/qualifications/attempts/:attemptId/pause
router.post(
  "/attempts/:attemptId/pause",
  authenticate,
  pauseQualificationAttemptController
);

// Submit individual question answer
// POST /api/qualifications/attempts/:attemptId/answer
router.post(
  "/attempts/:attemptId/answer",
  authenticate,
  submitQualificationAnswerController
);

// Submit complete assessment
// POST /api/qualifications/attempts/:attemptId/submit
router.post(
  "/attempts/:attemptId/submit",
  authenticate,
  submitQualificationAttemptController
);

// Get attempt
// GET /api/qualifications/attempts/:attemptId
router.get(
  "/attempts/:attemptId",
  authenticate,
  getQualificationAttemptController
);

export default router;