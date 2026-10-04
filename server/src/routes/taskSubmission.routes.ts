import { Router } from "express";

import {
  authenticate,
} from "../middleware/auth.middleware.js";

import asyncHandler from "../utils/asyncHandler.js";

import {
  getAllTaskSubmissions,
  getTaskSubmission,
  createNewTaskSubmission,
  updateExistingTaskSubmission,
  submitExistingTaskSubmission,
  moveSubmissionToReview,
} from "../controllers/taskSubmission.controller.js";

// ============================================================
// ROUTER
// ============================================================

const router = Router();

// ============================================================
// AUTHENTICATION
// ============================================================

router.use(authenticate);

// ============================================================
// GET ALL TASK SUBMISSIONS
// ============================================================

router.get(
  "/",
  asyncHandler(
    getAllTaskSubmissions
  )
);

// ============================================================
// CREATE TASK SUBMISSION
// ============================================================

router.post(
  "/",
  asyncHandler(
    createNewTaskSubmission
  )
);

// ============================================================
// GET TASK SUBMISSION BY ID
// ============================================================

router.get(
  "/:taskSubmissionId",
  asyncHandler(
    getTaskSubmission
  )
);

// ============================================================
// UPDATE TASK SUBMISSION
// ============================================================

router.patch(
  "/:taskSubmissionId",
  asyncHandler(
    updateExistingTaskSubmission
  )
);

// ============================================================
// SUBMIT TASK SUBMISSION
// ============================================================

router.post(
  "/:taskSubmissionId/submit",
  asyncHandler(
    submitExistingTaskSubmission
  )
);

// ============================================================
// MOVE SUBMISSION TO REVIEW
// ============================================================

router.post(
  "/:taskSubmissionId/review",
  asyncHandler(
    moveSubmissionToReview
  )
);

// ============================================================
// EXPORT
// ============================================================

export default router;