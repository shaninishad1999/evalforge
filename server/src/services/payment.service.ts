import mongoose from "mongoose";

import Payment from "../models/Payment.js";
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

interface PaymentUser {
  userId: string;
  role: UserRole;
}

interface CreatePaymentInput {
  contributor?: string | null;
  withdrawal?: string | null;
  wallet?: string | null;
  type:
    | "WITHDRAWAL"
    | "REFUND"
    | "ADJUSTMENT";
  provider:
    | "RAZORPAY"
    | "BANK_TRANSFER"
    | "UPI"
    | "PAYPAL"
    | "AIRTm"
    | "MANUAL";
  amount: number;
  currency?: string;
  status?:
    | "PENDING"
    | "PROCESSING"
    | "SUCCESS"
    | "FAILED"
    | "REFUNDED"
    | "CANCELLED";
  transactionId?: string | null;
  providerPaymentId?: string | null;
  providerOrderId?: string | null;
  providerResponse?: Record<
    string,
    unknown
  >;
  failureReason?: string;
}

interface UpdatePaymentInput {
  provider?:
    | "RAZORPAY"
    | "BANK_TRANSFER"
    | "UPI"
    | "PAYPAL"
    | "AIRTm"
    | "MANUAL";
  amount?: number;
  currency?: string;
  transactionId?: string | null;
  providerPaymentId?: string | null;
  providerOrderId?: string | null;
  providerResponse?: Record<
    string,
    unknown
  >;
  failureReason?: string;
}

interface UpdatePaymentStatusInput {
  status:
    | "PENDING"
    | "PROCESSING"
    | "SUCCESS"
    | "FAILED"
    | "REFUNDED"
    | "CANCELLED";
  transactionId?: string | null;
  providerPaymentId?: string | null;
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

const canManagePayments = (
  role: UserRole
): boolean => {
  return (
    role === "SUPER_ADMIN" ||
    role === "ADMIN"
  );
};

const canViewAllPayments = (
  role: UserRole
): boolean => {
  return (
    role === "SUPER_ADMIN" ||
    role === "ADMIN"
  );
};

// ============================================================
// CREATE PAYMENT
// ============================================================

export const createPayment = async (
  data: CreatePaymentInput,
  user: PaymentUser
) => {
  if (!canManagePayments(user.role)) {
    throw new ApiError(
      403,
      "You are not allowed to create payments"
    );
  }

  if (
    data.contributor &&
    !isValidObjectId(data.contributor)
  ) {
    throw new ApiError(
      400,
      "Invalid contributor ID"
    );
  }

  if (
    data.withdrawal &&
    !isValidObjectId(data.withdrawal)
  ) {
    throw new ApiError(
      400,
      "Invalid withdrawal ID"
    );
  }

  if (
    data.wallet &&
    !isValidObjectId(data.wallet)
  ) {
    throw new ApiError(
      400,
      "Invalid wallet ID"
    );
  }

  let contributor = null;
  let withdrawal = null;
  let wallet = null;

  if (data.contributor) {
    contributor =
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
        "Payment contributor must have CONTRIBUTOR role"
      );
    }
  }

  if (data.wallet) {
    wallet =
      await Wallet.findById(
        data.wallet
      );

    if (!wallet) {
      throw new ApiError(
        404,
        "Wallet not found"
      );
    }
  }

  if (data.withdrawal) {
    withdrawal =
      await Withdrawal.findById(
        data.withdrawal
      );

    if (!withdrawal) {
      throw new ApiError(
        404,
        "Withdrawal not found"
      );
    }

    if (
      data.type === "WITHDRAWAL" &&
      withdrawal.status !== "PAID"
    ) {
      throw new ApiError(
        400,
        "Withdrawal must be paid before creating a successful withdrawal payment"
      );
    }

    if (
      data.contributor &&
      withdrawal.contributor.toString() !==
        data.contributor
    ) {
      throw new ApiError(
        400,
        "Withdrawal does not belong to the selected contributor"
      );
    }

    if (
      data.wallet &&
      withdrawal.wallet.toString() !==
        data.wallet
    ) {
      throw new ApiError(
        400,
        "Withdrawal does not belong to the selected wallet"
      );
    }
  }

  if (
    data.type === "WITHDRAWAL" &&
    !data.withdrawal
  ) {
    throw new ApiError(
      400,
      "Withdrawal ID is required for withdrawal payment"
    );
  }

  const payment =
    await Payment.create({
      contributor:
        data.contributor ?? null,

      withdrawal:
        data.withdrawal ?? null,

      wallet:
        data.wallet ?? null,

      type:
        data.type,

      provider:
        data.provider,

      amount:
        data.amount,

      currency:
        data.currency ?? "INR",

      status:
        data.status ?? "PENDING",

      transactionId:
        data.transactionId ?? null,

      providerPaymentId:
        data.providerPaymentId ??
        null,

      providerOrderId:
        data.providerOrderId ??
        null,

      providerResponse:
        data.providerResponse ?? {},

      failureReason:
        data.failureReason ?? "",

      processedBy:
        null,

      initiatedAt:
        new Date(),

      processedAt:
        null,

      completedAt:
        null,
    });

  return payment;
};

// ============================================================
// GET PAYMENT BY ID
// ============================================================

export const getPaymentById =
  async (
    paymentId: string,
    user: PaymentUser
  ) => {
    if (!isValidObjectId(paymentId)) {
      throw new ApiError(
        400,
        "Invalid payment ID"
      );
    }

    const payment =
      await Payment.findById(
        paymentId
      )
        .populate(
          "contributor",
          "name email role"
        )
        .populate(
          "withdrawal"
        )
        .populate(
          "wallet"
        )
        .populate(
          "processedBy",
          "name email role"
        );

    if (!payment) {
      throw new ApiError(
        404,
        "Payment not found"
      );
    }

    const canView =
      canViewAllPayments(
        user.role
      ) ||
      (
        user.role === "CONTRIBUTOR" &&
        payment.contributor?.toString() ===
          user.userId
      );

    if (!canView) {
      throw new ApiError(
        403,
        "You are not allowed to view this payment"
      );
    }

    return payment;
  };

// ============================================================
// GET PAYMENTS
// ============================================================

export const getPayments =
  async (
    user: PaymentUser,
    filters?: {
      contributor?: string;
      withdrawal?: string;
      wallet?: string;
      type?:
        | "WITHDRAWAL"
        | "REFUND"
        | "ADJUSTMENT";
      provider?:
        | "RAZORPAY"
        | "BANK_TRANSFER"
        | "UPI"
        | "PAYPAL"
        | "AIRTm"
        | "MANUAL";
      status?:
        | "PENDING"
        | "PROCESSING"
        | "SUCCESS"
        | "FAILED"
        | "REFUNDED"
        | "CANCELLED";
    }
  ) => {
    const query: Record<
      string,
      unknown
    > = {};

    if (
      canViewAllPayments(
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
        "You are not allowed to view payments"
      );
    }

    if (
      filters?.withdrawal &&
      isValidObjectId(
        filters.withdrawal
      )
    ) {
      query.withdrawal =
        filters.withdrawal;
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

    if (filters?.type) {
      query.type =
        filters.type;
    }

    if (filters?.provider) {
      query.provider =
        filters.provider;
    }

    if (filters?.status) {
      query.status =
        filters.status;
    }

    return Payment.find(query)
      .populate(
        "contributor",
        "name email role"
      )
      .populate(
        "withdrawal"
      )
      .populate(
        "wallet"
      )
      .populate(
        "processedBy",
        "name email role"
      )
      .sort({
        initiatedAt: -1,
      });
  };

// ============================================================
// GET CONTRIBUTOR PAYMENTS
// ============================================================

export const getContributorPayments =
  async (
    contributorId: string,
    user: PaymentUser
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
      canViewAllPayments(
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
        "You are not allowed to view these payments"
      );
    }

    return Payment.find({
      contributor:
        contributorId,
    })
      .populate(
        "withdrawal"
      )
      .populate(
        "wallet"
      )
      .populate(
        "processedBy",
        "name email role"
      )
      .sort({
        initiatedAt: -1,
      });
  };

// ============================================================
// UPDATE PAYMENT
// ============================================================

export const updatePayment =
  async (
    paymentId: string,
    data: UpdatePaymentInput,
    user: PaymentUser
  ) => {
    if (!canManagePayments(user.role)) {
      throw new ApiError(
        403,
        "You are not allowed to update payments"
      );
    }

    if (!isValidObjectId(paymentId)) {
      throw new ApiError(
        400,
        "Invalid payment ID"
      );
    }

    const payment =
      await Payment.findById(
        paymentId
      );

    if (!payment) {
      throw new ApiError(
        404,
        "Payment not found"
      );
    }

    if (
      payment.status ===
        "SUCCESS" ||
      payment.status ===
        "REFUNDED"
    ) {
      throw new ApiError(
        400,
        "Completed payments cannot be updated"
      );
    }

    if (
      data.provider !== undefined
    ) {
      payment.provider =
        data.provider;
    }

    if (
      data.amount !== undefined
    ) {
      payment.amount =
        data.amount;
    }

    if (
      data.currency !== undefined
    ) {
      payment.currency =
        data.currency;
    }

    if (
      data.transactionId !==
      undefined
    ) {
      payment.transactionId =
        data.transactionId;
    }

    if (
      data.providerPaymentId !==
      undefined
    ) {
      payment.providerPaymentId =
        data.providerPaymentId;
    }

    if (
      data.providerOrderId !==
      undefined
    ) {
      payment.providerOrderId =
        data.providerOrderId;
    }

    if (
      data.providerResponse !==
      undefined
    ) {
      payment.providerResponse =
        data.providerResponse;
    }

    if (
      data.failureReason !==
      undefined
    ) {
      payment.failureReason =
        data.failureReason;
    }

    await payment.save();

    return payment;
  };

// ============================================================
// UPDATE PAYMENT STATUS
// ============================================================

export const updatePaymentStatus =
  async (
    paymentId: string,
    data: UpdatePaymentStatusInput,
    user: PaymentUser
  ) => {
    if (!canManagePayments(user.role)) {
      throw new ApiError(
        403,
        "You are not allowed to update payment status"
      );
    }

    if (!isValidObjectId(paymentId)) {
      throw new ApiError(
        400,
        "Invalid payment ID"
      );
    }

    const payment =
      await Payment.findById(
        paymentId
      );

    if (!payment) {
      throw new ApiError(
        404,
        "Payment not found"
      );
    }

    const currentStatus =
      payment.status;

    const newStatus =
      data.status;

    if (
      currentStatus ===
        "REFUNDED" ||
      currentStatus ===
        "CANCELLED"
    ) {
      throw new ApiError(
        400,
        "This payment has already reached a final status"
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
          "Only pending payments can move to processing"
        );
      }

      payment.status =
        "PROCESSING";

      payment.processedBy =
        new mongoose.Types.ObjectId(
          user.userId
        );

      payment.processedAt =
        new Date();
    }

    // ----------------------------------------------------------
    // SUCCESS
    // ----------------------------------------------------------

    if (
      newStatus === "SUCCESS"
    ) {
      if (
        currentStatus !==
          "PROCESSING" &&
        currentStatus !==
          "PENDING"
      ) {
        throw new ApiError(
          400,
          "Only pending or processing payments can be marked successful"
        );
      }

      payment.status =
        "SUCCESS";

      payment.transactionId =
        data.transactionId ??
        payment.transactionId;

      payment.providerPaymentId =
        data.providerPaymentId ??
        payment.providerPaymentId;

      payment.processedBy =
        new mongoose.Types.ObjectId(
          user.userId
        );

      payment.processedAt =
        payment.processedAt ??
        new Date();

      payment.completedAt =
        new Date();
    }

    // ----------------------------------------------------------
    // FAILED
    // ----------------------------------------------------------

    if (
      newStatus === "FAILED"
    ) {
      payment.status =
        "FAILED";

      payment.failureReason =
        data.failureReason ??
        "";

      payment.processedBy =
        new mongoose.Types.ObjectId(
          user.userId
        );

      payment.processedAt =
        new Date();
    }

    // ----------------------------------------------------------
    // REFUNDED
    // ----------------------------------------------------------

    if (
      newStatus === "REFUNDED"
    ) {
      if (
        currentStatus !==
        "SUCCESS"
      ) {
        throw new ApiError(
          400,
          "Only successful payments can be refunded"
        );
      }

      payment.status =
        "REFUNDED";

      payment.processedBy =
        new mongoose.Types.ObjectId(
          user.userId
        );

      payment.processedAt =
        new Date();

      payment.completedAt =
        new Date();
    }

    // ----------------------------------------------------------
    // CANCELLED
    // ----------------------------------------------------------

    if (
      newStatus === "CANCELLED"
    ) {
      if (
        currentStatus !==
          "PENDING" &&
        currentStatus !==
          "PROCESSING"
      ) {
        throw new ApiError(
          400,
          "Only pending or processing payments can be cancelled"
        );
      }

      payment.status =
        "CANCELLED";

      payment.failureReason =
        data.failureReason ??
        "";

      payment.processedBy =
        new mongoose.Types.ObjectId(
          user.userId
        );

      payment.processedAt =
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
          "Only new payments can have pending status"
        );
      }

      payment.status =
        "PENDING";
    }

    if (
      data.transactionId !==
      undefined
    ) {
      payment.transactionId =
        data.transactionId;
    }

    if (
      data.providerPaymentId !==
      undefined
    ) {
      payment.providerPaymentId =
        data.providerPaymentId;
    }

    if (
      data.failureReason !==
      undefined
    ) {
      payment.failureReason =
        data.failureReason;
    }

    await payment.save();

    return payment;
  };