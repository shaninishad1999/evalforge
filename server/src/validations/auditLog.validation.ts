import { z } from "zod";

// ============================================================
// AUDIT ACTION
// ============================================================

const auditActionSchema =
  z.enum([
    "LOGIN",
    "LOGOUT",
    "REGISTER",
    "CREATE",
    "UPDATE",
    "DELETE",
    "VIEW",
    "CLAIM",
    "SUBMIT",
    "APPROVE",
    "REJECT",
    "REVISION",
    "ASSIGN",
    "UNASSIGN",
    "PAYMENT",
    "WITHDRAWAL",
    "REFUND",
    "STATUS_CHANGE",
    "PASSWORD_CHANGE",
    "KYC",
    "FACE_VERIFICATION",
    "SYSTEM",
  ]);

// ============================================================
// AUDIT RESOURCE
// ============================================================

const auditResourceSchema =
  z.enum([
    "AUTH",
    "USER",
    "PROJECT",
    "QUALIFICATION",
    "DATASET",
    "DATASET_ITEM",
    "TASK",
    "TASK_SUBMISSION",
    "TASK_REVIEW",
    "EARNING",
    "WALLET",
    "WITHDRAWAL",
    "PAYMENT",
    "NOTIFICATION",
    "KYC",
    "FACE_VERIFICATION",
    "SYSTEM",
  ]);

// ============================================================
// AUDIT STATUS
// ============================================================

const auditStatusSchema =
  z.enum([
    "SUCCESS",
    "FAILED",
  ]);

// ============================================================
// CREATE AUDIT LOG
// ============================================================

export const createAuditLogSchema =
  z.object({
    user: z
      .string()
      .nullable()
      .optional(),

    action:
      auditActionSchema,

    resource:
      auditResourceSchema,

    resourceId: z
      .string()
      .trim()
      .max(300)
      .nullable()
      .optional(),

    status:
      auditStatusSchema,

    description: z
      .string()
      .trim()
      .min(
        1,
        "Audit description is required"
      )
      .max(5000),

    metadata:
      z.record(
        z.string(),
        z.unknown()
      )
      .optional(),

    ipAddress: z
      .string()
      .trim()
      .max(100)
      .nullable()
      .optional(),

    userAgent: z
      .string()
      .trim()
      .max(2000)
      .nullable()
      .optional(),
  });

// ============================================================
// AUDIT LOG ID
// ============================================================

export const auditLogIdSchema =
  z.object({
    auditLogId: z
      .string()
      .min(
        1,
        "Audit log ID is required"
      ),
  });