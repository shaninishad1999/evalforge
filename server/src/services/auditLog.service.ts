import mongoose from "mongoose";

import AuditLog from "../models/AuditLog.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";

// ============================================================
// TYPES
// ============================================================

type AuditAction =
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

type AuditResource =
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

type AuditStatus =
  | "SUCCESS"
  | "FAILED";

type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "CLIENT"
  | "PROJECT_MANAGER"
  | "REVIEWER"
  | "CONTRIBUTOR";

interface AuditUser {
  userId: string;
  role: UserRole;
}

interface CreateAuditLogInput {
  user?: string | null;

  action:
    AuditAction;

  resource:
    AuditResource;

  resourceId?:
    string | null;

  status:
    AuditStatus;

  description:
    string;

  metadata?: Record<
    string,
    unknown
  >;

  ipAddress?:
    string | null;

  userAgent?:
    string | null;
}

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

const canViewAuditLogs = (
  role: UserRole
): boolean => {
  return (
    role === "SUPER_ADMIN" ||
    role === "ADMIN"
  );
};

// ============================================================
// CREATE AUDIT LOG
// ============================================================

export const createAuditLog =
  async (
    data: CreateAuditLogInput
  ) => {
    if (
      data.user &&
      !isValidObjectId(data.user)
    ) {
      throw new ApiError(
        400,
        "Invalid user ID"
      );
    }

    if (data.user) {
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
    }

    const auditLog =
      await AuditLog.create({
        user:
          data.user ?? null,

        action:
          data.action,

        resource:
          data.resource,

        resourceId:
          data.resourceId ??
          null,

        status:
          data.status,

        description:
          data.description,

        metadata:
          data.metadata ?? {},

        ipAddress:
          data.ipAddress ??
          null,

        userAgent:
          data.userAgent ??
          null,
      });

    return auditLog;
  };

// ============================================================
// CREATE AUDIT LOG FROM AUTHENTICATED USER
// ============================================================

export const createUserAuditLog =
  async (
    user: AuditUser,
    data: Omit<
      CreateAuditLogInput,
      "user"
    >
  ) => {
    return createAuditLog({
      ...data,
      user: user.userId,
    });
  };

// ============================================================
// GET AUDIT LOG BY ID
// ============================================================

export const getAuditLogById =
  async (
    auditLogId: string,
    user: AuditUser
  ) => {
    if (
      !isValidObjectId(
        auditLogId
      )
    ) {
      throw new ApiError(
        400,
        "Invalid audit log ID"
      );
    }

    if (
      !canViewAuditLogs(
        user.role
      )
    ) {
      throw new ApiError(
        403,
        "You are not allowed to view audit logs"
      );
    }

    const auditLog =
      await AuditLog.findById(
        auditLogId
      ).populate(
        "user",
        "name email role"
      );

    if (!auditLog) {
      throw new ApiError(
        404,
        "Audit log not found"
      );
    }

    return auditLog;
  };

// ============================================================
// GET AUDIT LOGS
// ============================================================

export const getAuditLogs =
  async (
    user: AuditUser,
    filters?: {
      userId?: string;
      action?: AuditAction;
      resource?: AuditResource;
      resourceId?: string;
      status?: AuditStatus;
    }
  ) => {
    if (
      !canViewAuditLogs(
        user.role
      )
    ) {
      throw new ApiError(
        403,
        "You are not allowed to view audit logs"
      );
    }

    const query: Record<
      string,
      unknown
    > = {};

    if (filters?.userId) {
      if (
        !isValidObjectId(
          filters.userId
        )
      ) {
        throw new ApiError(
          400,
          "Invalid user ID"
        );
      }

      query.user =
        filters.userId;
    }

    if (filters?.action) {
      query.action =
        filters.action;
    }

    if (filters?.resource) {
      query.resource =
        filters.resource;
    }

    if (filters?.resourceId) {
      query.resourceId =
        filters.resourceId;
    }

    if (filters?.status) {
      query.status =
        filters.status;
    }

    return AuditLog.find(
      query
    )
      .populate(
        "user",
        "name email role"
      )
      .sort({
        createdAt: -1,
      });
  };

// ============================================================
// GET USER AUDIT LOGS
// ============================================================

export const getUserAuditLogs =
  async (
    userId: string,
    user: AuditUser
  ) => {
    if (
      !canViewAuditLogs(
        user.role
      )
    ) {
      throw new ApiError(
        403,
        "You are not allowed to view audit logs"
      );
    }

    if (
      !isValidObjectId(userId)
    ) {
      throw new ApiError(
        400,
        "Invalid user ID"
      );
    }

    return AuditLog.find({
      user: userId,
    })
      .populate(
        "user",
        "name email role"
      )
      .sort({
        createdAt: -1,
      });
  };

// ============================================================
// GET RESOURCE AUDIT LOGS
// ============================================================

export const getResourceAuditLogs =
  async (
    resource: AuditResource,
    resourceId: string,
    user: AuditUser
  ) => {
    if (
      !canViewAuditLogs(
        user.role
      )
    ) {
      throw new ApiError(
        403,
        "You are not allowed to view audit logs"
      );
    }

    return AuditLog.find({
      resource,
      resourceId,
    })
      .populate(
        "user",
        "name email role"
      )
      .sort({
        createdAt: -1,
      });
  };