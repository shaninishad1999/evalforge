import { Router } from "express";

import {
  getAllTaskReviews,
  getTaskReview,
  createNewTaskReview,
  updateExistingTaskReview,
  completeExistingTaskReview,
} from "../controllers/taskReview.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

import asyncHandler from "../utils/asyncHandler.js";

// ============================================================
// ROUTER
// ============================================================

const router = Router();

// ============================================================
// TASK REVIEW ROUTES
// ============================================================

// Get all task reviews
router.get(
  "/",
  authenticate,
  asyncHandler(getAllTaskReviews)
);

// Get task review by ID
router.get(
  "/:taskReviewId",
  authenticate,
  asyncHandler(getTaskReview)
);

// Create task review
router.post(
  "/",
  authenticate,
  asyncHandler(createNewTaskReview)
);

// Update task review
router.patch(
  "/:taskReviewId",
  authenticate,
  asyncHandler(updateExistingTaskReview)
);

// Complete task review
router.post(
  "/:taskReviewId/complete",
  authenticate,
  asyncHandler(
    completeExistingTaskReview
  )
);

export default router;