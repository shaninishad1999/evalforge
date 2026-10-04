import { Response } from "express";

import {
  AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

import {
  createEarningSchema,
  updateEarningSchema,
  updateEarningStatusSchema,
  earningIdSchema,
} from "../validations/earning.validation.js";

import {
  createEarning,
  getEarningById,
  getEarnings,
  getContributorEarningSummary,
  updateEarning,
  updateEarningStatus,
} from "../services/earning.service.js";

import ApiError from "../utils/ApiError.js";

// ============================================================
// GET ALL EARNINGS
// ============================================================

export const getAllEarnings = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    throw new ApiError(
      401,
      "Authentication required"
    );
  }

  const earnings =
    await getEarnings(
      req.user,
      {
        contributor:
          typeof req.query
            .contributor ===
          "string"
            ? req.query.contributor
            : undefined,

        task:
          typeof req.query.task ===
          "string"
            ? req.query.task
            : undefined,

        submission:
          typeof req.query
            .submission ===
          "string"
            ? req.query.submission
            : undefined,

        project:
          typeof req.query.project ===
          "string"
            ? req.query.project
            : undefined,

        source:
          typeof req.query.source ===
          "string"
            ? (req.query.source as
                | "TASK"
                | "BONUS"
                | "ADJUSTMENT")
            : undefined,

        status:
          typeof req.query.status ===
          "string"
            ? (req.query.status as
                | "PENDING"
                | "AVAILABLE"
                | "PROCESSING"
                | "PAID"
                | "FAILED"
                | "CANCELLED")
            : undefined,
      }
    );

  return res.status(200).json({
    success: true,
    message:
      "Earnings fetched successfully",
    data: earnings,
  });
};

// ============================================================
// GET EARNING BY ID
// ============================================================

export const getEarning = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    throw new ApiError(
      401,
      "Authentication required"
    );
  }

  const parsed =
    earningIdSchema.safeParse(
      req.params
    );

  if (!parsed.success) {
    throw new ApiError(
      400,
      parsed.error.issues[0]?.message ??
        "Invalid earning ID"
    );
  }

  const earning =
    await getEarningById(
      parsed.data.earningId,
      req.user
    );

  return res.status(200).json({
    success: true,
    message:
      "Earning fetched successfully",
    data: earning,
  });
};

// ============================================================
// CREATE EARNING
// ============================================================

export const createNewEarning =
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

    const parsed =
      createEarningSchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      throw new ApiError(
        400,
        parsed.error.issues[0]?.message ??
          "Invalid earning data"
      );
    }

    const earning =
      await createEarning(
        parsed.data,
        req.user
      );

    return res.status(201).json({
      success: true,
      message:
        "Earning created successfully",
      data: earning,
    });
  };

// ============================================================
// GET CONTRIBUTOR EARNING SUMMARY
// ============================================================

export const getContributorSummary =
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

    const parsed =
      earningIdSchema.safeParse({
        earningId:
          req.params.contributorId,
      });

    if (!parsed.success) {
      throw new ApiError(
        400,
        "Invalid contributor ID"
      );
    }

    const summary =
      await getContributorEarningSummary(
        parsed.data.earningId,
        req.user
      );

    return res.status(200).json({
      success: true,
      message:
        "Contributor earning summary fetched successfully",
      data: summary,
    });
  };

// ============================================================
// UPDATE EARNING
// ============================================================

export const updateExistingEarning =
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

    const params =
      earningIdSchema.safeParse(
        req.params
      );

    if (!params.success) {
      throw new ApiError(
        400,
        params.error.issues[0]?.message ??
          "Invalid earning ID"
      );
    }

    const body =
      updateEarningSchema.safeParse(
        req.body
      );

    if (!body.success) {
      throw new ApiError(
        400,
        body.error.issues[0]?.message ??
          "Invalid earning data"
      );
    }

    const earning =
      await updateEarning(
        params.data.earningId,
        body.data,
        req.user
      );

    return res.status(200).json({
      success: true,
      message:
        "Earning updated successfully",
      data: earning,
    });
  };

// ============================================================
// UPDATE EARNING STATUS
// ============================================================

export const updateExistingEarningStatus =
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

    const params =
      earningIdSchema.safeParse(
        req.params
      );

    if (!params.success) {
      throw new ApiError(
        400,
        params.error.issues[0]?.message ??
          "Invalid earning ID"
      );
    }

    const body =
      updateEarningStatusSchema.safeParse(
        req.body
      );

    if (!body.success) {
      throw new ApiError(
        400,
        body.error.issues[0]?.message ??
          "Invalid earning status"
      );
    }

    const earning =
      await updateEarningStatus(
        params.data.earningId,
        body.data.status,
        req.user
      );

    return res.status(200).json({
      success: true,
      message:
        "Earning status updated successfully",
      data: earning,
    });
  };