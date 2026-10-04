import mongoose, {
  Document,
  Schema,
} from "mongoose";

// ============================================================
// AUDIT LOG ACTIONS
// ============================================================

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "REGISTER"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "VIEW"
  | "CLAIM"
  | "SUBMIT"
  | "APPROVE"
  | "REJECT"
  | "REVISION"
  | "ASSIGN"
  | "UNASSIGN"
  | "PAYMENT"
  | "WITHDRAWAL"
  | "REFUND"
  | "STATUS_CHANGE"
  | "PASSWORD_CHANGE"
  | "KYC"
  | "FACE_VERIFICATION"
  | "SYSTEM";

// ============================================================
// AUDIT LOG RESOURCE TYPES
// ============================================================

export type AuditResource =
  | "AUTH"
  | "USER"
  | "PROJECT"
  | "QUALIFICATION"
  | "DATASET"
  | "DATASET_ITEM"
  | "TASK"
  | "TASK_SUBMISSION"
  | "TASK_REVIEW"
  | "EARNING"
  | "WALLET"
  | "WITHDRAWAL"
  | "PAYMENT"
  | "NOTIFICATION"
  | "KYC"
  | "FACE_VERIFICATION"
  | "SYSTEM";

// ============================================================
// AUDIT LOG STATUS
// ============================================================

export type AuditStatus =
  | "SUCCESS"
  | "FAILED";

// ============================================================
// AUDIT LOG DOCUMENT INTERFACE
// ============================================================

export interface IAuditLog
  extends Document {
  user:
    | mongoose.Types.ObjectId
    | null;

  action:
    AuditAction;

  resource:
    AuditResource;

  resourceId:
    string | null;

  status:
    AuditStatus;

  description:
    string;

  metadata:
    Record<string, unknown>;

  ipAddress:
    string | null;

  userAgent:
    string | null;

  createdAt:
    Date;

  updatedAt:
    Date;
}

// ============================================================
// AUDIT LOG SCHEMA
// ============================================================

const auditLogSchema =
  new Schema<IAuditLog>(
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true,
      },

      action: {
        type: String,
        enum: [
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
        ],
        required: true,
        index: true,
      },

      resource: {
        type: String,
        enum: [
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
        ],
        required: true,
        index: true,
      },

      resourceId: {
        type: String,
        default: null,
        trim: true,
        maxlength: 300,
        index: true,
      },

      status: {
        type: String,
        enum: [
          "SUCCESS",
          "FAILED",
        ],
        required: true,
        index: true,
      },

      description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000,
      },

      metadata: {
        type: Schema.Types.Mixed,
        default: {},
      },

      ipAddress: {
        type: String,
        default: null,
        trim: true,
        maxlength: 100,
      },

      userAgent: {
        type: String,
        default: null,
        trim: true,
        maxlength: 2000,
      },
    },
    {
      timestamps: true,
    }
  );

// ============================================================
// INDEXES
// ============================================================

auditLogSchema.index({
  user: 1,
  createdAt: -1,
});

auditLogSchema.index({
  action: 1,
  createdAt: -1,
});

auditLogSchema.index({
  resource: 1,
  resourceId: 1,
  createdAt: -1,
});

auditLogSchema.index({
  status: 1,
  createdAt: -1,
});

auditLogSchema.index({
  createdAt: -1,
});

// ============================================================
// MODEL
// ============================================================

const AuditLog =
  mongoose.model<IAuditLog>(
    "AuditLog",
    auditLogSchema
  );

export default AuditLog;