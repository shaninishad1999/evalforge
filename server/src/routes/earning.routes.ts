import { Router } from "express";

import {
  getAllEarnings,
  getEarning,
  createNewEarning,
  getContributorSummary,
  updateExistingEarning,
  updateExistingEarningStatus,
} from "../controllers/earning.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

import asyncHandler from "../utils/asyncHandler.js";

// ============================================================
// ROUTER
// ============================================================

const router = Router();

// ============================================================
// EARNING ROUTES
// ============================================================

// Get all earnings
router.get(
  "/",
  authenticate,
  asyncHandler(getAllEarnings)
);

// Get contributor earning summary
router.get(
  "/contributors/:contributorId/summary",
  authenticate,
  asyncHandler(getContributorSummary)
);

// Get earning by ID
router.get(
  "/:earningId",
  authenticate,
  asyncHandler(getEarning)
);

// Create earning
router.post(
  "/",
  authenticate,
  asyncHandler(createNewEarning)
);

// Update earning
router.patch(
  "/:earningId",
  authenticate,
  asyncHandler(updateExistingEarning)
);

// Update earning status
router.patch(
  "/:earningId/status",
  authenticate,
  asyncHandler(
    updateExistingEarningStatus
  )
);

export default router;