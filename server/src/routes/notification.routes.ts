import { Router } from "express";

import {
  authenticate,
} from "../middleware/auth.middleware.js";

import {
  authorize,
} from "../middleware/role.middleware.js";

import asyncHandler from "../utils/asyncHandler.js";

import {
  createNotificationController,
  getNotificationByIdController,
  getMyNotificationsController,
  getUnreadNotificationsController,
  getUnreadNotificationCountController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
  updateNotificationController,
  deleteNotificationController,
} from "../controllers/notification.controller.js";

// ============================================================
// ROUTER
// ============================================================

const router =
  Router();

// ============================================================
// NOTIFICATION ROUTES
// ============================================================

// Get my notifications
router.get(
  "/",
  authenticate,
  asyncHandler(
    getMyNotificationsController
  )
);

// Get unread notifications
router.get(
  "/unread",
  authenticate,
  asyncHandler(
    getUnreadNotificationsController
  )
);

// Get unread notification count
router.get(
  "/unread/count",
  authenticate,
  asyncHandler(
    getUnreadNotificationCountController
  )
);

// Get notification by ID
router.get(
  "/:notificationId",
  authenticate,
  asyncHandler(
    getNotificationByIdController
  )
);

// Create notification
// Only ADMIN and SUPER_ADMIN can manually create
// notifications for users.
//
// Internal services can still call createNotification()
// directly without going through this HTTP route.
router.post(
  "/",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "ADMIN"
  ),
  asyncHandler(
    createNotificationController
  )
);

// Mark all notifications as read
router.patch(
  "/read-all",
  authenticate,
  asyncHandler(
    markAllNotificationsAsReadController
  )
);

// Mark notification as read
router.patch(
  "/:notificationId/read",
  authenticate,
  asyncHandler(
    markNotificationAsReadController
  )
);

// Update notification
router.patch(
  "/:notificationId",
  authenticate,
  asyncHandler(
    updateNotificationController
  )
);

// Delete notification
router.delete(
  "/:notificationId",
  authenticate,
  asyncHandler(
    deleteNotificationController
  )
);

// ============================================================
// EXPORT
// ============================================================

export default router;