import { Router } from "express";

import {
  getAllWithdrawals,
  getWithdrawal,
  getContributorWithdrawalData,
  createNewWithdrawal,
  updateExistingWithdrawal,
  updateExistingWithdrawalStatus,
  cancelExistingWithdrawal,
} from "../controllers/withdrawal.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

import asyncHandler from "../utils/asyncHandler.js";

// ============================================================
// ROUTER
// ============================================================

const router = Router();

// ============================================================
// WITHDRAWAL ROUTES
// ============================================================

// Get all withdrawals
router.get(
  "/",
  authenticate,
  asyncHandler(getAllWithdrawals)
);

// Get contributor withdrawals
router.get(
  "/contributors/:contributorId",
  authenticate,
  asyncHandler(
    getContributorWithdrawalData
  )
);

// Get withdrawal by ID
router.get(
  "/:withdrawalId",
  authenticate,
  asyncHandler(getWithdrawal)
);

// Create withdrawal request
router.post(
  "/",
  authenticate,
  asyncHandler(createNewWithdrawal)
);

// Update withdrawal
router.patch(
  "/:withdrawalId",
  authenticate,
  asyncHandler(
    updateExistingWithdrawal
  )
);

// Update withdrawal status
router.patch(
  "/:withdrawalId/status",
  authenticate,
  asyncHandler(
    updateExistingWithdrawalStatus
  )
);

// Cancel withdrawal
router.post(
  "/:withdrawalId/cancel",
  authenticate,
  asyncHandler(
    cancelExistingWithdrawal
  )
);

export default router;