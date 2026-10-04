import { Router } from "express";

import {
  getAdminUsersController,
  getAdminUserByIdController,
  updateAdminUserRoleController,
  updateAdminUserActiveStatusController,
  updateAdminUserVerificationController,
} from "../controllers/adminUser.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

import { authorize } from "../middleware/role.middleware.js";

import asyncHandler from "../utils/asyncHandler.js";

const router = Router();

// ============================================================
// ADMIN USER MANAGEMENT
// ============================================================

// Get users
// GET /api/admin/users
router.get(
  "/",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "ADMIN"
  ),
  asyncHandler(
    getAdminUsersController
  )
);

// Get user by ID
// GET /api/admin/users/:userId
router.get(
  "/:userId",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "ADMIN"
  ),
  asyncHandler(
    getAdminUserByIdController
  )
);

// Update user role
// PATCH /api/admin/users/:userId/role
router.patch(
  "/:userId/role",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "ADMIN"
  ),
  asyncHandler(
    updateAdminUserRoleController
  )
);

// Update active status
// PATCH /api/admin/users/:userId/active-status
router.patch(
  "/:userId/active-status",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "ADMIN"
  ),
  asyncHandler(
    updateAdminUserActiveStatusController
  )
);

// Update verification status
// PATCH /api/admin/users/:userId/verification
router.patch(
  "/:userId/verification",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "ADMIN"
  ),
  asyncHandler(
    updateAdminUserVerificationController
  )
);

export default router;