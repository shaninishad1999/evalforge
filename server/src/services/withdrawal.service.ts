import mongoose from "mongoose";

import Withdrawal from "../models/Withdrawal.js";
import Wallet from "../models/Wallet.js";
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

interface WithdrawalUser {
  userId: string;
  role: UserRole;
}

interface CreateWithdrawalInput {
  wallet: string;
  amount: number;
  currency?: string;
  method:
    | "BANK_TRANSFER"
    | "UPI"
    | "PAYPAL"
    | "AIRTm";
  paymentDetails?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
    paypalEmail?: string;
  };
}

interface UpdateWithdrawalInput {
  amount?: number;
  currency?: string;
  method?:
    | "BANK_TRANSFER"
    | "UPI"
    | "PAYPAL"
    | "AIRTm";
  paymentDetails?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
    paypalEmail?: string;
  };
  transactionId?: string | null;
  failureReason?: string;
}

interface UpdateWithdrawalStatusInput {
  status:
    | "PENDING"
    | "PROCESSING"
    | "PAID"
    | "FAILED"
    | "CANCELLED";
  transactionId?: string | null;
  failureReason?: string;
}

// ============================================================
// HELPERS
// ============================================================

const isValidObjectId = (
  id: string
): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

const canManageWithdrawals = (
  role: UserRole
): boolean => {
  return (
    role === "SUPER_ADMIN" ||
    role === "ADMIN"
  );
};

const canViewAllWithdrawals = (
  role: UserRole
): boolean => {
  return (
    role === "SUPER_ADMIN" ||
    role === "ADMIN"
  );
};

// ============================================================
// CREATE WITHDRAWAL
// ============================================================

export const createWithdrawal =
  async (
    data: CreateWithdrawalInput,
    user: WithdrawalUser
  ) => {
    if (
      user.role !==
      "CONTRIBUTOR"
    ) {
      throw new ApiError(
        403,
        "Only contributors can create withdrawal requests"
      );
    }

    if (!isValidObjectId(data.wallet)) {
      throw new ApiError(
        400,
        "Invalid wallet ID"
      );
    }

    const contributor =
      await User.findById(
        user.userId
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
        403,
        "Only contributors can request withdrawals"
      );
    }

    const wallet =
      await Wallet.findById(
        data.wallet
      );

    if (!wallet) {
      throw new ApiError(
        404,
        "Wallet not found"
      );
    }

    if (
      wallet.contributor.toString() !==
      user.userId
    ) {
      throw new ApiError(
        403,
        "This wallet does not belong to you"
      );
    }

    if (
      wallet.status !== "ACTIVE"
    ) {
      throw new ApiError(
        400,
        "Wallet is not active"
      );
    }

    if (
      data.amount >
      wallet.balance.available
    ) {
      throw new ApiError(
        400,
        "Insufficient available balance"
      );
    }

    if (data.amount <= 0) {
      throw new ApiError(
        400,
        "Withdrawal amount must be greater than 0"
      );
    }

    const existingPendingWithdrawal =
      await Withdrawal.findOne({
        contributor:
          user.userId,
        wallet: wallet._id,
        status: {
          $in: [
            "PENDING",
            "PROCESSING",
          ],
        },
      });

    if (existingPendingWithdrawal) {
      throw new ApiError(
        409,
        "You already have a pending or processing withdrawal"
      );
    }

    const withdrawal =
      await Withdrawal.create({
        contributor:
          user.userId,

        wallet:
          wallet._id,

        amount:
          data.amount,

        currency:
          data.currency ??
          wallet.currency,

        method:
          data.method,

        paymentDetails: {
          accountHolderName:
            data.paymentDetails
              ?.accountHolderName ??
            "",

          accountNumber:
            data.paymentDetails
              ?.accountNumber ??
            "",

          ifscCode:
            data.paymentDetails
              ?.ifscCode ??
            "",

          upiId:
            data.paymentDetails
              ?.upiId ??
            "",

          paypalEmail:
            data.paymentDetails
              ?.paypalEmail ??
            "",
        },

        status: "PENDING",

        transactionId:
          null,

        failureReason:
          "",

        processedBy:
          null,

        requestedAt:
          new Date(),

        processedAt:
          null,

        paidAt:
          null,
      });

    return withdrawal;
  };

// ============================================================
// GET WITHDRAWAL BY ID
// ============================================================

export const getWithdrawalById =
  async (
    withdrawalId: string,
    user: WithdrawalUser
  ) => {
    if (
      !isValidObjectId(
        withdrawalId
      )
    ) {
      throw new ApiError(
        400,
        "Invalid withdrawal ID"
      );
    }

    const withdrawal =
      await Withdrawal.findById(
        withdrawalId
      )
        .populate(
          "contributor",
          "name email role"
        )
        .populate(
          "wallet"
        )
        .populate(
          "processedBy",
          "name email role"
        );

    if (!withdrawal) {
      throw new ApiError(
        404,
        "Withdrawal not found"
      );
    }

    const canView =
      canViewAllWithdrawals(
        user.role
      ) ||
      (
        user.role ===
          "CONTRIBUTOR" &&
        withdrawal.contributor.toString() ===
          user.userId
      );

    if (!canView) {
      throw new ApiError(
        403,
        "You are not allowed to view this withdrawal"
      );
    }

    return withdrawal;
  };

// ============================================================
// GET WITHDRAWALS
// ============================================================

export const getWithdrawals =
  async (
    user: WithdrawalUser,
    filters?: {
      contributor?: string;
      wallet?: string;
      status?:
        | "PENDING"
        | "PROCESSING"
        | "PAID"
        | "FAILED"
        | "CANCELLED";
      method?:
        | "BANK_TRANSFER"
        | "UPI"
        | "PAYPAL"
        | "AIRTm";
    }
  ) => {
    const query: Record<
      string,
      unknown
    > = {};

    if (
      canViewAllWithdrawals(
        user.role
      )
    ) {
      if (
        filters?.contributor &&
        isValidObjectId(
          filters.contributor
        )
      ) {
        query.contributor =
          filters.contributor;
      }
    } else if (
      user.role === "CONTRIBUTOR"
    ) {
      query.contributor =
        user.userId;
    } else {
      throw new ApiError(
        403,
        "You are not allowed to view withdrawals"
      );
    }

    if (
      filters?.wallet &&
      isValidObjectId(
        filters.wallet
      )
    ) {
      query.wallet =
        filters.wallet;
    }

    if (filters?.status) {
      query.status =
        filters.status;
    }

    if (filters?.method) {
      query.method =
        filters.method;
    }

    return Withdrawal.find(query)
      .populate(
        "contributor",
        "name email role"
      )
      .populate("wallet")
      .populate(
        "processedBy",
        "name email role"
      )
      .sort({
        requestedAt: -1,
      });
  };

// ============================================================
// GET CONTRIBUTOR WITHDRAWALS
// ============================================================

export const getContributorWithdrawals =
  async (
    contributorId: string,
    user: WithdrawalUser
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
      canViewAllWithdrawals(
        user.role
      ) ||
      (
        user.role ===
          "CONTRIBUTOR" &&
        user.userId ===
          contributorId
      );

    if (!canView) {
      throw new ApiError(
        403,
        "You are not allowed to view these withdrawals"
      );
    }

    return Withdrawal.find({
      contributor:
        contributorId,
    })
      .populate(
        "wallet"
      )
      .populate(
        "processedBy",
        "name email role"
      )
      .sort({
        requestedAt: -1,
      });
  };

// ============================================================
// UPDATE WITHDRAWAL
// ============================================================

export const updateWithdrawal =
  async (
    withdrawalId: string,
    data: UpdateWithdrawalInput,
    user: WithdrawalUser
  ) => {
    if (
      !canManageWithdrawals(
        user.role
      )
    ) {
      throw new ApiError(
        403,
        "You are not allowed to update withdrawals"
      );
    }

    if (
      !isValidObjectId(
        withdrawalId
      )
    ) {
      throw new ApiError(
        400,
        "Invalid withdrawal ID"
      );
    }

    const withdrawal =
      await Withdrawal.findById(
        withdrawalId
      );

    if (!withdrawal) {
      throw new ApiError(
        404,
        "Withdrawal not found"
      );
    }

    if (
      withdrawal.status ===
        "PAID" ||
      withdrawal.status ===
        "CANCELLED"
    ) {
      throw new ApiError(
        400,
        "Completed or cancelled withdrawals cannot be updated"
      );
    }

    if (
      data.amount !== undefined
    ) {
      withdrawal.amount =
        data.amount;
    }

    if (
      data.currency !== undefined
    ) {
      withdrawal.currency =
        data.currency;
    }

    if (
      data.method !== undefined
    ) {
      withdrawal.method =
        data.method;
    }

    if (
      data.paymentDetails !==
      undefined
    ) {
      withdrawal.paymentDetails = {
        accountHolderName:
          data.paymentDetails
            .accountHolderName ??
          withdrawal
            .paymentDetails
            .accountHolderName,

        accountNumber:
          data.paymentDetails
            .accountNumber ??
          withdrawal
            .paymentDetails
            .accountNumber,

        ifscCode:
          data.paymentDetails
            .ifscCode ??
          withdrawal
            .paymentDetails
            .ifscCode,

        upiId:
          data.paymentDetails
            .upiId ??
          withdrawal
            .paymentDetails
            .upiId,

        paypalEmail:
          data.paymentDetails
            .paypalEmail ??
          withdrawal
            .paymentDetails
            .paypalEmail,
      };
    }

    if (
      data.transactionId !==
      undefined
    ) {
      withdrawal.transactionId =
        data.transactionId;
    }

    if (
      data.failureReason !==
      undefined
    ) {
      withdrawal.failureReason =
        data.failureReason;
    }

    await withdrawal.save();

    return withdrawal;
  };

// ============================================================
// UPDATE WITHDRAWAL STATUS
// ============================================================

export const updateWithdrawalStatus =
  async (
    withdrawalId: string,
    data: UpdateWithdrawalStatusInput,
    user: WithdrawalUser
  ) => {
    if (
      !canManageWithdrawals(
        user.role
      )
    ) {
      throw new ApiError(
        403,
        "You are not allowed to update withdrawal status"
      );
    }

    if (
      !isValidObjectId(
        withdrawalId
      )
    ) {
      throw new ApiError(
        400,
        "Invalid withdrawal ID"
      );
    }

    const withdrawal =
      await Withdrawal.findById(
        withdrawalId
      );

    if (!withdrawal) {
      throw new ApiError(
        404,
        "Withdrawal not found"
      );
    }

    const wallet =
      await Wallet.findById(
        withdrawal.wallet
      );

    if (!wallet) {
      throw new ApiError(
        404,
        "Wallet not found"
      );
    }

    const currentStatus =
      withdrawal.status;

    const newStatus =
      data.status;

    if (
      currentStatus ===
        "PAID" ||
      currentStatus ===
        "CANCELLED"
    ) {
      throw new ApiError(
        400,
        "This withdrawal has already reached a final status"
      );
    }

    // ----------------------------------------------------------
    // PROCESSING
    // ----------------------------------------------------------

    if (
      newStatus ===
      "PROCESSING"
    ) {
      if (
        currentStatus !==
          "PENDING"
      ) {
        throw new ApiError(
          400,
          "Only pending withdrawals can move to processing"
        );
      }

      if (
        withdrawal.amount >
        wallet.balance.available
      ) {
        throw new ApiError(
          400,
          "Insufficient available wallet balance"
        );
      }

      wallet.balance.available -=
        withdrawal.amount;

      wallet.balance.processing +=
        withdrawal.amount;

      withdrawal.status =
        "PROCESSING";

      withdrawal.processedBy =
        new mongoose.Types.ObjectId(
          user.userId
        );

      withdrawal.processedAt =
        new Date();
    }

    // ----------------------------------------------------------
    // PAID
    // ----------------------------------------------------------

    if (
      newStatus === "PAID"
    ) {
      if (
        currentStatus ===
        "PENDING"
      ) {
        if (
          withdrawal.amount >
          wallet.balance.available
        ) {
          throw new ApiError(
            400,
            "Insufficient available wallet balance"
          );
        }

        wallet.balance.available -=
          withdrawal.amount;
      }

      if (
        currentStatus ===
        "PROCESSING"
      ) {
        wallet.balance.processing -=
          withdrawal.amount;
      }

      wallet.balance.paid +=
        withdrawal.amount;

      withdrawal.status =
        "PAID";

      withdrawal.transactionId =
        data.transactionId ??
        withdrawal.transactionId;

      withdrawal.processedBy =
        new mongoose.Types.ObjectId(
          user.userId
        );

      withdrawal.processedAt =
        withdrawal.processedAt ??
        new Date();

      withdrawal.paidAt =
        new Date();
    }

    // ----------------------------------------------------------
    // FAILED
    // ----------------------------------------------------------

    if (
      newStatus === "FAILED"
    ) {
      if (
        currentStatus ===
        "PROCESSING"
      ) {
        wallet.balance.processing -=
          withdrawal.amount;

        wallet.balance.available +=
          withdrawal.amount;
      }

      withdrawal.status =
        "FAILED";

      withdrawal.failureReason =
        data.failureReason ??
        "";

      withdrawal.processedBy =
        new mongoose.Types.ObjectId(
          user.userId
        );

      withdrawal.processedAt =
        new Date();
    }

    // ----------------------------------------------------------
    // CANCELLED
    // ----------------------------------------------------------

    if (
      newStatus ===
      "CANCELLED"
    ) {
      if (
        currentStatus ===
        "PROCESSING"
      ) {
        wallet.balance.processing -=
          withdrawal.amount;

        wallet.balance.available +=
          withdrawal.amount;
      }

      withdrawal.status =
        "CANCELLED";

      withdrawal.failureReason =
        data.failureReason ??
        "";

      withdrawal.processedBy =
        new mongoose.Types.ObjectId(
          user.userId
        );

      withdrawal.processedAt =
        new Date();
    }

    // ----------------------------------------------------------
    // PENDING
    // ----------------------------------------------------------

    if (
      newStatus === "PENDING"
    ) {
      if (
        currentStatus !==
          "PENDING"
      ) {
        throw new ApiError(
          400,
          "Only new withdrawal requests can have pending status"
        );
      }

      withdrawal.status =
        "PENDING";
    }

    if (
      data.transactionId !==
      undefined
    ) {
      withdrawal.transactionId =
        data.transactionId;
    }

    await wallet.save();
    await withdrawal.save();

    return withdrawal;
  };

// ============================================================
// CANCEL WITHDRAWAL BY CONTRIBUTOR
// ============================================================

export const cancelWithdrawal =
  async (
    withdrawalId: string,
    user: WithdrawalUser
  ) => {
    if (
      user.role !==
      "CONTRIBUTOR"
    ) {
      throw new ApiError(
        403,
        "Only contributors can cancel their withdrawal requests"
      );
    }

    if (
      !isValidObjectId(
        withdrawalId
      )
    ) {
      throw new ApiError(
        400,
        "Invalid withdrawal ID"
      );
    }

    const withdrawal =
      await Withdrawal.findById(
        withdrawalId
      );

    if (!withdrawal) {
      throw new ApiError(
        404,
        "Withdrawal not found"
      );
    }

    if (
      withdrawal.contributor.toString() !==
      user.userId
    ) {
      throw new ApiError(
        403,
        "You are not allowed to cancel this withdrawal"
      );
    }

    if (
      withdrawal.status !==
      "PENDING"
    ) {
      throw new ApiError(
        400,
        "Only pending withdrawals can be cancelled"
      );
    }

    withdrawal.status =
      "CANCELLED";

    withdrawal.failureReason =
      "Cancelled by contributor";

    withdrawal.processedAt =
      new Date();

    await withdrawal.save();

    return withdrawal;
  };