import { z } from "zod";

// ============================================================
// NOTIFICATION TYPES
// ============================================================

const notificationTypeSchema =
  z.enum([
    "TASK",
    "REVIEW",
    "EARNING",
    "PAYMENT",
    "PROJECT",
    "QUALIFICATION",
    "SYSTEM",
  ]);

// ============================================================
// CREATE NOTIFICATION
// ============================================================

export const createNotificationSchema =
  z.object({
    user: z
      .string()
      .min(
        1,
        "User ID is required"
      ),

    type:
      notificationTypeSchema,

    title: z
      .string()
      .trim()
      .min(
        1,
        "Notification title is required"
      )
      .max(300),

    message: z
      .string()
      .trim()
      .min(
        1,
        "Notification message is required"
      )
      .max(5000),

    link: z
      .string()
      .trim()
      .max(1000)
      .nullable()
      .optional(),

    metadata:
      z.record(
        z.string(),
        z.unknown()
      )
      .optional(),
  });

// ============================================================
// UPDATE NOTIFICATION
// ============================================================

export const updateNotificationSchema =
  z
    .object({
      title: z
        .string()
        .trim()
        .min(1)
        .max(300)
        .optional(),

      message: z
        .string()
        .trim()
        .min(1)
        .max(5000)
        .optional(),

      link: z
        .string()
        .trim()
        .max(1000)
        .nullable()
        .optional(),

      metadata:
        z.record(
          z.string(),
          z.unknown()
        )
        .optional(),
    })
    .strict();

// ============================================================
// NOTIFICATION ID
// ============================================================

export const notificationIdSchema =
  z.object({
    notificationId: z
      .string()
      .min(
        1,
        "Notification ID is required"
      ),
  });

// ============================================================
// MARK AS READ
// ============================================================

export const markNotificationReadSchema =
  z.object({
    isRead: z.boolean(),
  });