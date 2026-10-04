import mongoose from "mongoose";

import Notification from "../models/Notification.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";

import {
  emitToUser,
} from "../socket/socket.js";

import {
  Server,
} from "socket.io";

// ============================================================
// TYPES
// ============================================================

type NotificationType =
  | "TASK"
  | "REVIEW"
  | "EARNING"
  | "PAYMENT"
  | "PROJECT"
  | "QUALIFICATION"
  | "SYSTEM";

type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "CLIENT"
  | "PROJECT_MANAGER"
  | "REVIEWER"
  | "CONTRIBUTOR";

interface NotificationUser {
  userId: string;
  role: UserRole;
}

interface CreateNotificationInput {
  user: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  metadata?: Record<
    string,
    unknown
  >;
}

interface UpdateNotificationInput {
  title?: string;
  message?: string;
  link?: string | null;
  metadata?: Record<
    string,
    unknown
  >;
}

// ============================================================
// SOCKET INSTANCE
// ============================================================

let socketServer:
  | Server
  | null = null;

// ============================================================
// SET SOCKET SERVER
// ============================================================

export const setNotificationSocket =
  (
    io: Server
  ) => {
    socketServer = io;
  };

// ============================================================
// HELPERS
// ============================================================

const isValidObjectId = (
  id: string
): boolean => {
  return mongoose.Types.ObjectId.isValid(
    id
  );
};

// ============================================================
// CREATE NOTIFICATION
// ============================================================

export const createNotification =
  async (
    data: CreateNotificationInput
  ) => {
    if (
      !isValidObjectId(data.user)
    ) {
      throw new ApiError(
        400,
        "Invalid user ID"
      );
    }

    const user =
      await User.findById(
        data.user
      );

    if (!user) {
      throw new ApiError(
        404,
        "User not found"
      );
    }

    const notification =
      await Notification.create({
        user: data.user,

        type: data.type,

        title: data.title,

        message: data.message,

        link:
          data.link ?? null,

        metadata:
          data.metadata ?? {},

        isRead: false,

        readAt: null,
      });

    // --------------------------------------------------------
    // REAL-TIME SOCKET NOTIFICATION
    // --------------------------------------------------------

    if (socketServer) {
      emitToUser(
        socketServer,
        data.user,
        "notification:new",
        {
          success: true,

          data: {
            notification,
          },
        }
      );
    }

    return notification;
  };

// ============================================================
// GET NOTIFICATION BY ID
// ============================================================

export const getNotificationById =
  async (
    notificationId: string,
    user: NotificationUser
  ) => {
    if (
      !isValidObjectId(
        notificationId
      )
    ) {
      throw new ApiError(
        400,
        "Invalid notification ID"
      );
    }

    const notification =
      await Notification.findById(
        notificationId
      ).populate(
        "user",
        "name email role"
      );

    if (!notification) {
      throw new ApiError(
        404,
        "Notification not found"
      );
    }

    if (
      notification.user._id.toString() !==
      user.userId
    ) {
      throw new ApiError(
        403,
        "You are not allowed to view this notification"
      );
    }

    return notification;
  };

// ============================================================
// GET MY NOTIFICATIONS
// ============================================================

export const getMyNotifications =
  async (
    user: NotificationUser,
    filters?: {
      isRead?: boolean;
      type?: NotificationType;
    }
  ) => {
    const query: Record<
      string,
      unknown
    > = {
      user: user.userId,
    };

    if (
      filters?.isRead !==
      undefined
    ) {
      query.isRead =
        filters.isRead;
    }

    if (filters?.type) {
      query.type =
        filters.type;
    }

    return Notification.find(
      query
    )
      .sort({
        createdAt: -1,
      })
      .populate(
        "user",
        "name email role"
      );
  };

// ============================================================
// GET UNREAD NOTIFICATIONS
// ============================================================

export const getUnreadNotifications =
  async (
    user: NotificationUser
  ) => {
    return Notification.find({
      user: user.userId,
      isRead: false,
    })
      .sort({
        createdAt: -1,
      })
      .populate(
        "user",
        "name email role"
      );
  };

// ============================================================
// GET UNREAD COUNT
// ============================================================

export const getUnreadNotificationCount =
  async (
    user: NotificationUser
  ) => {
    const count =
      await Notification.countDocuments({
        user: user.userId,
        isRead: false,
      });

    return count;
  };

// ============================================================
// MARK NOTIFICATION AS READ
// ============================================================

export const markNotificationAsRead =
  async (
    notificationId: string,
    user: NotificationUser
  ) => {
    if (
      !isValidObjectId(
        notificationId
      )
    ) {
      throw new ApiError(
        400,
        "Invalid notification ID"
      );
    }

    const notification =
      await Notification.findById(
        notificationId
      );

    if (!notification) {
      throw new ApiError(
        404,
        "Notification not found"
      );
    }

    if (
      notification.user.toString() !==
      user.userId
    ) {
      throw new ApiError(
        403,
        "You are not allowed to update this notification"
      );
    }

    if (!notification.isRead) {
      notification.isRead =
        true;

      notification.readAt =
        new Date();

      await notification.save();

      // ------------------------------------------------------
      // REAL-TIME READ EVENT
      // ------------------------------------------------------

      if (socketServer) {
        emitToUser(
          socketServer,
          user.userId,
          "notification:read",
          {
            success: true,

            data: {
              notificationId:
                notification._id,
              readAt:
                notification.readAt,
            },
          }
        );
      }
    }

    return notification;
  };

// ============================================================
// MARK ALL NOTIFICATIONS AS READ
// ============================================================

export const markAllNotificationsAsRead =
  async (
    user: NotificationUser
  ) => {
    const readAt =
      new Date();

    const result =
      await Notification.updateMany(
        {
          user: user.userId,
          isRead: false,
        },
        {
          $set: {
            isRead: true,
            readAt,
          },
        }
      );

    // --------------------------------------------------------
    // REAL-TIME READ-ALL EVENT
    // --------------------------------------------------------

    if (
      socketServer &&
      result.modifiedCount > 0
    ) {
      emitToUser(
        socketServer,
        user.userId,
        "notification:all-read",
        {
          success: true,

          data: {
            modifiedCount:
              result.modifiedCount,

            readAt,
          },
        }
      );
    }

    return {
      modifiedCount:
        result.modifiedCount,
    };
  };

// ============================================================
// UPDATE NOTIFICATION
// ============================================================

export const updateNotification =
  async (
    notificationId: string,
    data: UpdateNotificationInput,
    user: NotificationUser
  ) => {
    if (
      !isValidObjectId(
        notificationId
      )
    ) {
      throw new ApiError(
        400,
        "Invalid notification ID"
      );
    }

    const notification =
      await Notification.findById(
        notificationId
      );

    if (!notification) {
      throw new ApiError(
        404,
        "Notification not found"
      );
    }

    if (
      notification.user.toString() !==
      user.userId
    ) {
      throw new ApiError(
        403,
        "You are not allowed to update this notification"
      );
    }

    if (
      data.title !== undefined
    ) {
      notification.title =
        data.title;
    }

    if (
      data.message !== undefined
    ) {
      notification.message =
        data.message;
    }

    if (
      data.link !== undefined
    ) {
      notification.link =
        data.link;
    }

    if (
      data.metadata !==
      undefined
    ) {
      notification.metadata =
        data.metadata;
    }

    await notification.save();

    // --------------------------------------------------------
    // REAL-TIME UPDATE EVENT
    // --------------------------------------------------------

    if (socketServer) {
      emitToUser(
        socketServer,
        user.userId,
        "notification:updated",
        {
          success: true,

          data: {
            notification,
          },
        }
      );
    }

    return notification;
  };

// ============================================================
// DELETE NOTIFICATION
// ============================================================

export const deleteNotification =
  async (
    notificationId: string,
    user: NotificationUser
  ) => {
    if (
      !isValidObjectId(
        notificationId
      )
    ) {
      throw new ApiError(
        400,
        "Invalid notification ID"
      );
    }

    const notification =
      await Notification.findById(
        notificationId
      );

    if (!notification) {
      throw new ApiError(
        404,
        "Notification not found"
      );
    }

    if (
      notification.user.toString() !==
      user.userId
    ) {
      throw new ApiError(
        403,
        "You are not allowed to delete this notification"
      );
    }

    await notification.deleteOne();

    // --------------------------------------------------------
    // REAL-TIME DELETE EVENT
    // --------------------------------------------------------

    if (socketServer) {
      emitToUser(
        socketServer,
        user.userId,
        "notification:deleted",
        {
          success: true,

          data: {
            notificationId,
          },
        }
      );
    }

    return {
      notificationId,
      deleted: true,
    };
  };