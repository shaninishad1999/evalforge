import { Router } from "express";

import {
  authenticate,
} from "../middleware/auth.middleware.js";

import asyncHandler from "../utils/asyncHandler.js";

import {
  createPaymentController,
  getPaymentByIdController,
  getPaymentsController,
  getContributorPaymentsController,
  updatePaymentController,
  updatePaymentStatusController,
} from "../controllers/payment.controller.js";

// ============================================================
// ROUTER
// ============================================================

const router =
  Router();

// ============================================================
// PAYMENT ROUTES
// ============================================================

// Get all payments
router.get(
  "/",
  authenticate,
  asyncHandler(
    getPaymentsController
  )
);

// Get payments of a specific contributor
router.get(
  "/contributor/:contributorId",
  authenticate,
  asyncHandler(
    getContributorPaymentsController
  )
);

// Get payment by ID
router.get(
  "/:paymentId",
  authenticate,
  asyncHandler(
    getPaymentByIdController
  )
);

// Create payment
router.post(
  "/",
  authenticate,
  asyncHandler(
    createPaymentController
  )
);

// Update payment
router.patch(
  "/:paymentId",
  authenticate,
  asyncHandler(
    updatePaymentController
  )
);

// Update payment status
router.patch(
  "/:paymentId/status",
  authenticate,
  asyncHandler(
    updatePaymentStatusController
  )
);

// ============================================================
// EXPORT
// ============================================================

export default router;