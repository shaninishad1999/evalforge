import { Response } from "express";

import {
  AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

import {
  createAuditLog,
  getAuditLogById,
  getAuditLogs,
  getUserAuditLogs,
  getResourceAuditLogs,
} from "../services/auditLog.service.js";

import {
  createAuditLogSchema,
} from "../validations/auditLog.validation.js";

import ApiError from "../utils/ApiError.js";

// ============================================================
// CREATE AUDIT LOG
// ============================================================

export const createAuditLogController =
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
      createAuditLogSchema.parse(
        req.body
      );

    const auditLog =
      await createAuditLog(
        data
      );

    return res.status(201).json({
      success: true,
      message:
        "Audit log created successfully",
      data: {
        auditLog,
      },
    });
  };

// ============================================================
// GET AUDIT LOG BY ID
// ============================================================

export const getAuditLogByIdController =
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

    const auditLogId =
      Array.isArray(
        req.params.auditLogId
      )
        ? req.params.auditLogId[0]
        : req.params.auditLogId;

    if (!auditLogId) {
      throw new ApiError(
        400,
        "Audit log ID is required"
      );
    }

    const auditLog =
      await getAuditLogById(
        auditLogId,
        req.user
      );

    return res.status(200).json({
      success: true,
      message:
        "Audit log fetched successfully",
      data: {
        auditLog,
      },
    });
  };

// ============================================================
// GET AUDIT LOGS
// ============================================================

export const getAuditLogsController =
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
      userId,
      action,
      resource,
      resourceId,
      status,
    } = req.query;

    const auditLogs =
      await getAuditLogs(
        req.user,
        {
          userId:
            typeof userId ===
            "string"
              ? userId
              : undefined,

          action:
            typeof action ===
            "string"
              ? action as
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
                  | "SYSTEM"
              : undefined,

          resource:
            typeof resource ===
            "string"
              ? resource as
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
                  | "SYSTEM"
              : undefined,

          resourceId:
            typeof resourceId ===
            "string"
              ? resourceId
              : undefined,

          status:
            typeof status ===
            "string"
              ? status as
                  | "SUCCESS"
                  | "FAILED"
              : undefined,
        }
      );

    return res.status(200).json({
      success: true,
      message:
        "Audit logs fetched successfully",
      data: {
        auditLogs,
        count:
          auditLogs.length,
      },
    });
  };

// ============================================================
// GET USER AUDIT LOGS
// ============================================================

export const getUserAuditLogsController =
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

    const userId =
      Array.isArray(
        req.params.userId
      )
        ? req.params.userId[0]
        : req.params.userId;

    if (!userId) {
      throw new ApiError(
        400,
        "User ID is required"
      );
    }

    const auditLogs =
      await getUserAuditLogs(
        userId,
        req.user
      );

    return res.status(200).json({
      success: true,
      message:
        "User audit logs fetched successfully",
      data: {
        auditLogs,
        count:
          auditLogs.length,
      },
    });
  };

// ============================================================
// GET RESOURCE AUDIT LOGS
// ============================================================

export const getResourceAuditLogsController =
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

    const resource =
      Array.isArray(
        req.params.resource
      )
        ? req.params.resource[0]
        : req.params.resource;

    const resourceId =
      Array.isArray(
        req.params.resourceId
      )
        ? req.params.resourceId[0]
        : req.params.resourceId;

    if (!resource) {
      throw new ApiError(
        400,
        "Resource is required"
      );
    }

    if (!resourceId) {
      throw new ApiError(
        400,
        "Resource ID is required"
      );
    }

    const auditLogs =
      await getResourceAuditLogs(
        resource as
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
          | "SYSTEM",
        resourceId,
        req.user
      );

    return res.status(200).json({
      success: true,
      message:
        "Resource audit logs fetched successfully",
      data: {
        auditLogs,
        count:
          auditLogs.length,
      },
    });
  };