import { Router } from "express";

import {
  authenticate,
} from "../middleware/auth.middleware.js";

import {
  authorize,
} from "../middleware/role.middleware.js";

import asyncHandler from "../utils/asyncHandler.js";

import {
  createAuditLogController,
  getAuditLogByIdController,
  getAuditLogsController,
  getUserAuditLogsController,
  getResourceAuditLogsController,
} from "../controllers/auditLog.controller.js";

// ============================================================
// ROUTER
// ============================================================

const router =
  Router();

// ============================================================
// AUDIT LOG ROUTES
// ============================================================

// Get all audit logs
// Only ADMIN and SUPER_ADMIN can access audit logs.
router.get(
  "/",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "ADMIN"
  ),
  asyncHandler(
    getAuditLogsController
  )
);

// Get audit logs for a specific user
// Only ADMIN and SUPER_ADMIN can access audit logs.
router.get(
  "/user/:userId",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "ADMIN"
  ),
  asyncHandler(
    getUserAuditLogsController
  )
);

// Get audit logs for a specific resource
// Only ADMIN and SUPER_ADMIN can access audit logs.
router.get(
  "/resource/:resource/:resourceId",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "ADMIN"
  ),
  asyncHandler(
    getResourceAuditLogsController
  )
);

// Get audit log by ID
// Only ADMIN and SUPER_ADMIN can access audit logs.
router.get(
  "/:auditLogId",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "ADMIN"
  ),
  asyncHandler(
    getAuditLogByIdController
  )
);

// Create audit log
// Manual audit-log creation is restricted to
// ADMIN and SUPER_ADMIN.
//
// Internal services can still call createAuditLog()
// directly when recording system events.
router.post(
  "/",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "ADMIN"
  ),
  asyncHandler(
    createAuditLogController
  )
);

// ============================================================
// EXPORT
// ============================================================

export default router;