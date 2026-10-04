import { Response } from "express";

import {
  AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

import {
  createWithdrawalSchema,
  updateWithdrawalSchema,
  updateWithdrawalStatusSchema,
  withdrawalIdSchema,
  withdrawalContributorIdSchema,
} from "../validations/withdrawal.validation.js";

import {
  createWithdrawal,
  getWithdrawalById,
  getWithdrawals,
  getContributorWithdrawals,
  updateWithdrawal,
  updateWithdrawalStatus,
  cancelWithdrawal,
} from "../services/withdrawal.service.js";

import ApiError from "../utils/ApiError.js";

// ============================================================
// GET ALL WITHDRAWALS
// ============================================================

export const getAllWithdrawals = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    throw new ApiError(
      401,
      "Authentication required"
    );
  }

  const withdrawals =
    await getWithdrawals(
      req.user,
      {
        contributor:
          typeof req.query.contributor ===
          "string"
            ? req.query.contributor
            : undefined,

        wallet:
          typeof req.query.wallet ===
          "string"
            ? req.query.wallet
            : undefined,

        status:
          typeof req.query.status ===
          "string"
            ? (req.query.status as
                | "PENDING"
                | "PROCESSING"
                | "PAID"
                | "FAILED"
                | "CANCELLED")
            : undefined,

        method:
          typeof req.query.method ===
          "string"
            ? (req.query.method as
                | "BANK_TRANSFER"
                | "UPI"
                | "PAYPAL"
                | "AIRTm")
            : undefined,
      }
    );

  return res.status(200).json({
    success: true,
    message:
      "Withdrawals fetched successfully",
    data: withdrawals,
  });
};

// ============================================================
// GET WITHDRAWAL BY ID
// ============================================================

export const getWithdrawal = async (
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
    withdrawalIdSchema.safeParse(
      req.params
    );

  if (!parsed.success) {
    throw new ApiError(
      400,
      parsed.error.issues[0]?.message ??
        "Invalid withdrawal ID"
    );
  }

  const withdrawal =
    await getWithdrawalById(
      parsed.data.withdrawalId,
      req.user
    );

  return res.status(200).json({
    success: true,
    message:
      "Withdrawal fetched successfully",
    data: withdrawal,
  });
};

// ============================================================
// GET CONTRIBUTOR WITHDRAWALS
// ============================================================

export const getContributorWithdrawalData =
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
      withdrawalContributorIdSchema.safeParse(
        req.params
      );

    if (!parsed.success) {
      throw new ApiError(
        400,
        parsed.error.issues[0]?.message ??
          "Invalid contributor ID"
      );
    }

    const withdrawals =
      await getContributorWithdrawals(
        parsed.data.contributorId,
        req.user
      );

    return res.status(200).json({
      success: true,
      message:
        "Contributor withdrawals fetched successfully",
      data: withdrawals,
    });
  };

// ============================================================
// CREATE WITHDRAWAL
// ============================================================

export const createNewWithdrawal =
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
      createWithdrawalSchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      throw new ApiError(
        400,
        parsed.error.issues[0]?.message ??
          "Invalid withdrawal data"
      );
    }

    const withdrawal =
      await createWithdrawal(
        parsed.data,
        req.user
      );

    return res.status(201).json({
      success: true,
      message:
        "Withdrawal request created successfully",
      data: withdrawal,
    });
  };

// ============================================================
// UPDATE WITHDRAWAL
// ============================================================

export const updateExistingWithdrawal =
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
      withdrawalIdSchema.safeParse(
        req.params
      );

    if (!params.success) {
      throw new ApiError(
        400,
        params.error.issues[0]?.message ??
          "Invalid withdrawal ID"
      );
    }

    const body =
      updateWithdrawalSchema.safeParse(
        req.body
      );

    if (!body.success) {
      throw new ApiError(
        400,
        body.error.issues[0]?.message ??
          "Invalid withdrawal data"
      );
    }

    const withdrawal =
      await updateWithdrawal(
        params.data.withdrawalId,
        body.data,
        req.user
      );

    return res.status(200).json({
      success: true,
      message:
        "Withdrawal updated successfully",
      data: withdrawal,
    });
  };

// ============================================================
// UPDATE WITHDRAWAL STATUS
// ============================================================

export const updateExistingWithdrawalStatus =
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
      withdrawalIdSchema.safeParse(
        req.params
      );

    if (!params.success) {
      throw new ApiError(
        400,
        params.error.issues[0]?.message ??
          "Invalid withdrawal ID"
      );
    }

    const body =
      updateWithdrawalStatusSchema.safeParse(
        req.body
      );

    if (!body.success) {
      throw new ApiError(
        400,
        body.error.issues[0]?.message ??
          "Invalid withdrawal status"
      );
    }

    const withdrawal =
      await updateWithdrawalStatus(
        params.data.withdrawalId,
        body.data,
        req.user
      );

    return res.status(200).json({
      success: true,
      message:
        "Withdrawal status updated successfully",
      data: withdrawal,
    });
  };

// ============================================================
// CANCEL WITHDRAWAL
// ============================================================

export const cancelExistingWithdrawal =
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
      withdrawalIdSchema.safeParse(
        req.params
      );

    if (!params.success) {
      throw new ApiError(
        400,
        params.error.issues[0]?.message ??
          "Invalid withdrawal ID"
      );
    }

    const withdrawal =
      await cancelWithdrawal(
        params.data.withdrawalId,
        req.user
      );

    return res.status(200).json({
      success: true,
      message:
        "Withdrawal cancelled successfully",
      data: withdrawal,
    });
  };