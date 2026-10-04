import mongoose from "mongoose";

import Wallet from "../models/Wallet.js";
import Earning from "../models/Earning.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";

// ============================================================
// TYPES
// ============================================================

type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "CLIENT"
  | "PROJECT_MANAGER"
  | "REVIEWER"
  | "CONTRIBUTOR";

interface WalletUser {
  userId: string;
  role: UserRole;
}

interface CreateWalletInput {
  contributor: string;
  currency?: string;
  status?:
    | "ACTIVE"
    | "SUSPENDED"
    | "CLOSED";
}

interface UpdateWalletInput {
  currency?: string;
  status?:
    | "ACTIVE"
    | "SUSPENDED"
    | "CLOSED";
}

// ============================================================
// HELPERS
// ============================================================

const isValidObjectId = (
  id: string
): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

const canManageWallets = (
  role: UserRole
): boolean => {
  return (
    role === "SUPER_ADMIN" ||
    role === "ADMIN"
  );
};

const canViewAllWallets = (
  role: UserRole
): boolean => {
  return (
    role === "SUPER_ADMIN" ||
    role === "ADMIN"
  );
};

// ============================================================
// CREATE WALLET
// ============================================================

export const createWallet = async (
  data: CreateWalletInput,
  user: WalletUser
) => {
  if (!canManageWallets(user.role)) {
    throw new ApiError(
      403,
      "You are not allowed to create wallets"
    );
  }

  if (
    !isValidObjectId(
      data.contributor
    )
  ) {
    throw new ApiError(
      400,
      "Invalid contributor ID"
    );
  }

  const contributor =
    await User.findById(
      data.contributor
    );

  if (!contributor) {
    throw new ApiError(
      404,
      "Contributor not found"
    );
  }

  if (
    contributor.role !==
    "CONTRIBUTOR"
  ) {
    throw new ApiError(
      400,
      "Wallet can only be created for contributors"
    );
  }

  const existingWallet =
    await Wallet.findOne({
      contributor:
        data.contributor,
    });

  if (existingWallet) {
    throw new ApiError(
      409,
      "Wallet already exists for this contributor"
    );
  }

  const wallet =
    await Wallet.create({
      contributor:
        data.contributor,

      currency:
        data.currency ?? "INR",

      status:
        data.status ?? "ACTIVE",

      balance: {
        totalEarnings: 0,
        pending: 0,
        available: 0,
        processing: 0,
        paid: 0,
      },
    });

  return wallet;
};

// ============================================================
// GET WALLET BY ID
// ============================================================

export const getWalletById =
  async (
    walletId: string,
    user: WalletUser
  ) => {
    if (!isValidObjectId(walletId)) {
      throw new ApiError(
        400,
        "Invalid wallet ID"
      );
    }

    const wallet =
      await Wallet.findById(
        walletId
      ).populate(
        "contributor",
        "name email role"
      );

    if (!wallet) {
      throw new ApiError(
        404,
        "Wallet not found"
      );
    }

    const contributorId =
      wallet.contributor.toString();

    const canView =
      canViewAllWallets(
        user.role
      ) ||
      (
        user.role === "CONTRIBUTOR" &&
        contributorId ===
          user.userId
      );

    if (!canView) {
      throw new ApiError(
        403,
        "You are not allowed to view this wallet"
      );
    }

    return wallet;
  };

// ============================================================
// GET CONTRIBUTOR WALLET
// ============================================================

export const getContributorWallet =
  async (
    contributorId: string,
    user: WalletUser
  ) => {
    if (
      !isValidObjectId(
        contributorId
      )
    ) {
      throw new ApiError(
        400,
        "Invalid contributor ID"
      );
    }

    const canView =
      canViewAllWallets(
        user.role
      ) ||
      (
        user.role === "CONTRIBUTOR" &&
        user.userId ===
          contributorId
      );

    if (!canView) {
      throw new ApiError(
        403,
        "You are not allowed to view this wallet"
      );
    }

    const wallet =
      await Wallet.findOne({
        contributor:
          contributorId,
      }).populate(
        "contributor",
        "name email role"
      );

    if (!wallet) {
      throw new ApiError(
        404,
        "Wallet not found"
      );
    }

    return wallet;
  };

// ============================================================
// GET ALL WALLETS
// ============================================================

export const getWallets =
  async (
    user: WalletUser,
    filters?: {
      contributor?: string;
      status?:
        | "ACTIVE"
        | "SUSPENDED"
        | "CLOSED";
    }
  ) => {
    if (
      !canViewAllWallets(
        user.role
      )
    ) {
      throw new ApiError(
        403,
        "You are not allowed to view all wallets"
      );
    }

    const query: Record<
      string,
      unknown
    > = {};

    if (
      filters?.contributor &&
      isValidObjectId(
        filters.contributor
      )
    ) {
      query.contributor =
        filters.contributor;
    }

    if (filters?.status) {
      query.status =
        filters.status;
    }

    return Wallet.find(query)
      .populate(
        "contributor",
        "name email role"
      )
      .sort({
        createdAt: -1,
      });
  };

// ============================================================
// RECALCULATE WALLET BALANCE
// ============================================================

export const recalculateWallet =
  async (
    contributorId: string,
    user: WalletUser
  ) => {
    if (
      !isValidObjectId(
        contributorId
      )
    ) {
      throw new ApiError(
        400,
        "Invalid contributor ID"
      );
    }

    const canManage =
      canManageWallets(
        user.role
      );

    const isOwnWallet =
      user.role ===
        "CONTRIBUTOR" &&
      user.userId ===
        contributorId;

    if (!canManage && !isOwnWallet) {
      throw new ApiError(
        403,
        "You are not allowed to recalculate this wallet"
      );
    }

    const wallet =
      await Wallet.findOne({
        contributor:
          contributorId,
      });

    if (!wallet) {
      throw new ApiError(
        404,
        "Wallet not found"
      );
    }

    const earnings =
      await Earning.find({
        contributor:
          contributorId,
      });

    let totalEarnings = 0;
    let pending = 0;
    let available = 0;
    let processing = 0;
    let paid = 0;

    for (const earning of earnings) {
      totalEarnings +=
        earning.amount;

      if (
        earning.status ===
        "PENDING"
      ) {
        pending +=
          earning.amount;
      }

      if (
        earning.status ===
        "AVAILABLE"
      ) {
        available +=
          earning.amount;
      }

      if (
        earning.status ===
        "PROCESSING"
      ) {
        processing +=
          earning.amount;
      }

      if (
        earning.status ===
        "PAID"
      ) {
        paid +=
          earning.amount;
      }
    }

    wallet.balance = {
      totalEarnings,
      pending,
      available,
      processing,
      paid,
    };

    await wallet.save();

    return wallet;
  };

// ============================================================
// UPDATE WALLET
// ============================================================

export const updateWallet =
  async (
    walletId: string,
    data: UpdateWalletInput,
    user: WalletUser
  ) => {
    if (!canManageWallets(user.role)) {
      throw new ApiError(
        403,
        "You are not allowed to update wallets"
      );
    }

    if (!isValidObjectId(walletId)) {
      throw new ApiError(
        400,
        "Invalid wallet ID"
      );
    }

    const wallet =
      await Wallet.findById(
        walletId
      );

    if (!wallet) {
      throw new ApiError(
        404,
        "Wallet not found"
      );
    }

    if (
      data.currency !== undefined
    ) {
      wallet.currency =
        data.currency;
    }

    if (
      data.status !== undefined
    ) {
      wallet.status =
        data.status;
    }

    await wallet.save();

    return wallet;
  };

// ============================================================
// UPDATE WALLET STATUS
// ============================================================

export const updateWalletStatus =
  async (
    walletId: string,
    status:
      | "ACTIVE"
      | "SUSPENDED"
      | "CLOSED",
    user: WalletUser
  ) => {
    if (!canManageWallets(user.role)) {
      throw new ApiError(
        403,
        "You are not allowed to update wallet status"
      );
    }

    if (!isValidObjectId(walletId)) {
      throw new ApiError(
        400,
        "Invalid wallet ID"
      );
    }

    const wallet =
      await Wallet.findById(
        walletId
      );

    if (!wallet) {
      throw new ApiError(
        404,
        "Wallet not found"
      );
    }

    wallet.status =
      status;

    await wallet.save();

    return wallet;
  };