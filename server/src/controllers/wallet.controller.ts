import { Response } from "express";

import {
  AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

import {
  createWalletSchema,
  updateWalletSchema,
  updateWalletStatusSchema,
  walletIdSchema,
  walletContributorIdSchema,
} from "../validations/wallet.validation.js";

import {
  createWallet,
  getWalletById,
  getContributorWallet,
  getWallets,
  recalculateWallet,
  updateWallet,
  updateWalletStatus,
} from "../services/wallet.service.js";

import ApiError from "../utils/ApiError.js";

// ============================================================
// GET ALL WALLETS
// ============================================================

export const getAllWallets = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    throw new ApiError(
      401,
      "Authentication required"
    );
  }

  const wallets =
    await getWallets(
      req.user,
      {
        contributor:
          typeof req.query.contributor ===
          "string"
            ? req.query.contributor
            : undefined,

        status:
          typeof req.query.status ===
          "string"
            ? (req.query.status as
                | "ACTIVE"
                | "SUSPENDED"
                | "CLOSED")
            : undefined,
      }
    );

  return res.status(200).json({
    success: true,
    message:
      "Wallets fetched successfully",
    data: wallets,
  });
};

// ============================================================
// GET WALLET BY ID
// ============================================================

export const getWallet = async (
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
    walletIdSchema.safeParse(
      req.params
    );

  if (!parsed.success) {
    throw new ApiError(
      400,
      parsed.error.issues[0]?.message ??
        "Invalid wallet ID"
    );
  }

  const wallet =
    await getWalletById(
      parsed.data.walletId,
      req.user
    );

  return res.status(200).json({
    success: true,
    message:
      "Wallet fetched successfully",
    data: wallet,
  });
};

// ============================================================
// GET CONTRIBUTOR WALLET
// ============================================================

export const getContributorWalletData =
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
      walletContributorIdSchema.safeParse(
        req.params
      );

    if (!parsed.success) {
      throw new ApiError(
        400,
        parsed.error.issues[0]?.message ??
          "Invalid contributor ID"
      );
    }

    const wallet =
      await getContributorWallet(
        parsed.data.contributorId,
        req.user
      );

    return res.status(200).json({
      success: true,
      message:
        "Contributor wallet fetched successfully",
      data: wallet,
    });
  };

// ============================================================
// CREATE WALLET
// ============================================================

export const createNewWallet =
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
      createWalletSchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      throw new ApiError(
        400,
        parsed.error.issues[0]?.message ??
          "Invalid wallet data"
      );
    }

    const wallet =
      await createWallet(
        parsed.data,
        req.user
      );

    return res.status(201).json({
      success: true,
      message:
        "Wallet created successfully",
      data: wallet,
    });
  };

// ============================================================
// RECALCULATE WALLET
// ============================================================

export const recalculateContributorWallet =
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
      walletContributorIdSchema.safeParse(
        req.params
      );

    if (!parsed.success) {
      throw new ApiError(
        400,
        parsed.error.issues[0]?.message ??
          "Invalid contributor ID"
      );
    }

    const wallet =
      await recalculateWallet(
        parsed.data.contributorId,
        req.user
      );

    return res.status(200).json({
      success: true,
      message:
        "Wallet recalculated successfully",
      data: wallet,
    });
  };

// ============================================================
// UPDATE WALLET
// ============================================================

export const updateExistingWallet =
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
      walletIdSchema.safeParse(
        req.params
      );

    if (!params.success) {
      throw new ApiError(
        400,
        params.error.issues[0]?.message ??
          "Invalid wallet ID"
      );
    }

    const body =
      updateWalletSchema.safeParse(
        req.body
      );

    if (!body.success) {
      throw new ApiError(
        400,
        body.error.issues[0]?.message ??
          "Invalid wallet data"
      );
    }

    const wallet =
      await updateWallet(
        params.data.walletId,
        body.data,
        req.user
      );

    return res.status(200).json({
      success: true,
      message:
        "Wallet updated successfully",
      data: wallet,
    });
  };

// ============================================================
// UPDATE WALLET STATUS
// ============================================================

export const updateExistingWalletStatus =
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
      walletIdSchema.safeParse(
        req.params
      );

    if (!params.success) {
      throw new ApiError(
        400,
        params.error.issues[0]?.message ??
          "Invalid wallet ID"
      );
    }

    const body =
      updateWalletStatusSchema.safeParse(
        req.body
      );

    if (!body.success) {
      throw new ApiError(
        400,
        body.error.issues[0]?.message ??
          "Invalid wallet status"
      );
    }

    const wallet =
      await updateWalletStatus(
        params.data.walletId,
        body.data.status,
        req.user
      );

    return res.status(200).json({
      success: true,
      message:
        "Wallet status updated successfully",
      data: wallet,
    });
  };