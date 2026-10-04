import { Response } from "express";

import {
  AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

import {
  createNotification,
  getNotificationById,
  getMyNotifications,
  getUnreadNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  updateNotification,
  deleteNotification,
} from "../services/notification.service.js";

import {
  createNotificationSchema,
  updateNotificationSchema,
} from "../validations/notification.validation.js";

import ApiError from "../utils/ApiError.js";

// ============================================================
// CREATE NOTIFICATION
// ============================================================

export const createNotificationController =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required"
      );
    }

    const data =
      createNotificationSchema.parse(
        req.body
      );

    const notification =
      await createNotification(
        data
      );

    return res.status(201).json({
      success: true,
      message:
        "Notification created successfully",
      data: {
        notification,
      },
    });
  };

// ============================================================
// GET NOTIFICATION BY ID
// ============================================================

export const getNotificationByIdController =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required"
      );
    }

    const notificationId =
      Array.isArray(
        req.params.notificationId
      )
        ? req.params.notificationId[0]
        : req.params.notificationId;

    if (!notificationId) {
      throw new ApiError(
        400,
        "Notification ID is required"
      );
    }

    const notification =
      await getNotificationById(
        notificationId,
        req.user
      );

    return res.status(200).json({
      success: true,
      message:
        "Notification fetched successfully",
      data: {
        notification,
      },
    });
  };

// ============================================================
// GET MY NOTIFICATIONS
// ============================================================

export const getMyNotificationsController =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required"
      );
    }

    const {
      isRead,
      type,
    } = req.query;

    let parsedIsRead:
      | boolean
      | undefined;

    if (
      typeof isRead ===
      "string"
    ) {
      if (isRead === "true") {
        parsedIsRead =
          true;
      }

      if (isRead === "false") {
        parsedIsRead =
          false;
      }
    }

    const notifications =
      await getMyNotifications(
        req.user,
        {
          isRead:
            parsedIsRead,

          type:
            typeof type ===
            "string"
              ? type as
                  | "TASK"
                  | "REVIEW"
                  | "EARNING"
                  | "PAYMENT"
                  | "PROJECT"
                  | "QUALIFICATION"
                  | "SYSTEM"
              : undefined,
        }
      );

    return res.status(200).json({
      success: true,
      message:
        "Notifications fetched successfully",
      data: {
        notifications,
        count:
          notifications.length,
      },
    });
  };

// ============================================================
// GET UNREAD NOTIFICATIONS
// ============================================================

export const getUnreadNotificationsController =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required"
      );
    }

    const notifications =
      await getUnreadNotifications(
        req.user
      );

    return res.status(200).json({
      success: true,
      message:
        "Unread notifications fetched successfully",
      data: {
        notifications,
        count:
          notifications.length,
      },
    });
  };

// ============================================================
// GET UNREAD COUNT
// ============================================================

export const getUnreadNotificationCountController =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required"
      );
    }

    const count =
      await getUnreadNotificationCount(
        req.user
      );

    return res.status(200).json({
      success: true,
      message:
        "Unread notification count fetched successfully",
      data: {
        count,
      },
    });
  };

// ============================================================
// MARK NOTIFICATION AS READ
// ============================================================

export const markNotificationAsReadController =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required"
      );
    }

    const notificationId =
      Array.isArray(
        req.params.notificationId
      )
        ? req.params.notificationId[0]
        : req.params.notificationId;

    if (!notificationId) {
      throw new ApiError(
        400,
        "Notification ID is required"
      );
    }

    const notification =
      await markNotificationAsRead(
        notificationId,
        req.user
      );

    return res.status(200).json({
      success: true,
      message:
        "Notification marked as read",
      data: {
        notification,
      },
    });
  };

// ============================================================
// MARK ALL NOTIFICATIONS AS READ
// ============================================================

export const markAllNotificationsAsReadController =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required"
      );
    }

    const result =
      await markAllNotificationsAsRead(
        req.user
      );

    return res.status(200).json({
      success: true,
      message:
        "All notifications marked as read",
      data: result,
    });
  };

// ============================================================
// UPDATE NOTIFICATION
// ============================================================

export const updateNotificationController =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required"
      );
    }

    const notificationId =
      Array.isArray(
        req.params.notificationId
      )
        ? req.params.notificationId[0]
        : req.params.notificationId;

    if (!notificationId) {
      throw new ApiError(
        400,
        "Notification ID is required"
      );
    }

    const data =
      updateNotificationSchema.parse(
        req.body
      );

    const notification =
      await updateNotification(
        notificationId,
        data,
        req.user
      );

    return res.status(200).json({
      success: true,
      message:
        "Notification updated successfully",
      data: {
        notification,
      },
    });
  };

// ============================================================
// DELETE NOTIFICATION
// ============================================================

export const deleteNotificationController =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required"
      );
    }

    const notificationId =
      Array.isArray(
        req.params.notificationId
      )
        ? req.params.notificationId[0]
        : req.params.notificationId;

    if (!notificationId) {
      throw new ApiError(
        400,
        "Notification ID is required"
      );
    }

    const result =
      await deleteNotification(
        notificationId,
        req.user
      );

    return res.status(200).json({
      success: true,
      message:
        "Notification deleted successfully",
      data: result,
    });
  };