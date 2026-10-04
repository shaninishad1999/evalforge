import { Router } from "express";

import {
  getAllWallets,
  getWallet,
  getContributorWalletData,
  createNewWallet,
  recalculateContributorWallet,
  updateExistingWallet,
  updateExistingWalletStatus,
} from "../controllers/wallet.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

import asyncHandler from "../utils/asyncHandler.js";

// ============================================================
// ROUTER
// ============================================================

const router = Router();

// ============================================================
// WALLET ROUTES
// ============================================================

// Get all wallets
router.get(
  "/",
  authenticate,
  asyncHandler(getAllWallets)
);

// Get contributor wallet
router.get(
  "/contributors/:contributorId",
  authenticate,
  asyncHandler(
    getContributorWalletData
  )
);

// Recalculate contributor wallet
router.post(
  "/contributors/:contributorId/recalculate",
  authenticate,
  asyncHandler(
    recalculateContributorWallet
  )
);

// Get wallet by ID
router.get(
  "/:walletId",
  authenticate,
  asyncHandler(getWallet)
);

// Create wallet
router.post(
  "/",
  authenticate,
  asyncHandler(createNewWallet)
);

// Update wallet
router.patch(
  "/:walletId",
  authenticate,
  asyncHandler(updateExistingWallet)
);

// Update wallet status
router.patch(
  "/:walletId/status",
  authenticate,
  asyncHandler(
    updateExistingWalletStatus
  )
);

export default router;