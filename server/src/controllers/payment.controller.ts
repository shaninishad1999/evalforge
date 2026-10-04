import { Response } from "express";

import {
  AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

import {
  createPayment,
  getPaymentById,
  getPayments,
  getContributorPayments,
  updatePayment,
  updatePaymentStatus,
} from "../services/payment.service.js";

import {
  createPaymentSchema,
  updatePaymentSchema,
  updatePaymentStatusSchema,
} from "../validations/payment.validation.js";

import ApiError from "../utils/ApiError.js";

// ============================================================
// CREATE PAYMENT
// ============================================================

export const createPaymentController =
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
      createPaymentSchema.parse(
        req.body
      );

    const payment =
      await createPayment(
        data,
        req.user
      );

    return res.status(201).json({
      success: true,
      message:
        "Payment created successfully",
      data: {
        payment,
      },
    });
  };

// ============================================================
// GET PAYMENT BY ID
// ============================================================

export const getPaymentByIdController =
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

    const paymentId =
      Array.isArray(
        req.params.paymentId
      )
        ? req.params.paymentId[0]
        : req.params.paymentId;

    if (!paymentId) {
      throw new ApiError(
        400,
        "Payment ID is required"
      );
    }

    const payment =
      await getPaymentById(
        paymentId,
        req.user
      );

    return res.status(200).json({
      success: true,
      message:
        "Payment fetched successfully",
      data: {
        payment,
      },
    });
  };

// ============================================================
// GET PAYMENTS
// ============================================================

export const getPaymentsController =
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
      contributor,
      withdrawal,
      wallet,
      type,
      provider,
      status,
    } = req.query;

    const payments =
      await getPayments(
        req.user,
        {
          contributor:
            typeof contributor ===
            "string"
              ? contributor
              : undefined,

          withdrawal:
            typeof withdrawal ===
            "string"
              ? withdrawal
              : undefined,

          wallet:
            typeof wallet ===
            "string"
              ? wallet
              : undefined,

          type:
            typeof type ===
            "string"
              ? type as
                  | "WITHDRAWAL"
                  | "REFUND"
                  | "ADJUSTMENT"
              : undefined,

          provider:
            typeof provider ===
            "string"
              ? provider as
                  | "RAZORPAY"
                  | "BANK_TRANSFER"
                  | "UPI"
                  | "PAYPAL"
                  | "AIRTm"
                  | "MANUAL"
              : undefined,

          status:
            typeof status ===
            "string"
              ? status as
                  | "PENDING"
                  | "PROCESSING"
                  | "SUCCESS"
                  | "FAILED"
                  | "REFUNDED"
                  | "CANCELLED"
              : undefined,
        }
      );

    return res.status(200).json({
      success: true,
      message:
        "Payments fetched successfully",
      data: {
        payments,
        count: payments.length,
      },
    });
  };

// ============================================================
// GET CONTRIBUTOR PAYMENTS
// ============================================================

export const getContributorPaymentsController =
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

    const contributorId =
      Array.isArray(
        req.params.contributorId
      )
        ? req.params.contributorId[0]
        : req.params.contributorId;

    if (!contributorId) {
      throw new ApiError(
        400,
        "Contributor ID is required"
      );
    }

    const payments =
      await getContributorPayments(
        contributorId,
        req.user
      );

    return res.status(200).json({
      success: true,
      message:
        "Contributor payments fetched successfully",
      data: {
        payments,
        count: payments.length,
      },
    });
  };

// ============================================================
// UPDATE PAYMENT
// ============================================================

export const updatePaymentController =
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

    const paymentId =
      Array.isArray(
        req.params.paymentId
      )
        ? req.params.paymentId[0]
        : req.params.paymentId;

    if (!paymentId) {
      throw new ApiError(
        400,
        "Payment ID is required"
      );
    }

    const data =
      updatePaymentSchema.parse(
        req.body
      );

    const payment =
      await updatePayment(
        paymentId,
        data,
        req.user
      );

    return res.status(200).json({
      success: true,
      message:
        "Payment updated successfully",
      data: {
        payment,
      },
    });
  };

// ============================================================
// UPDATE PAYMENT STATUS
// ============================================================

export const updatePaymentStatusController =
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

    const paymentId =
      Array.isArray(
        req.params.paymentId
      )
        ? req.params.paymentId[0]
        : req.params.paymentId;

    if (!paymentId) {
      throw new ApiError(
        400,
        "Payment ID is required"
      );
    }

    const data =
      updatePaymentStatusSchema.parse(
        req.body
      );

    const payment =
      await updatePaymentStatus(
        paymentId,
        data,
        req.user
      );

    return res.status(200).json({
      success: true,
      message:
        "Payment status updated successfully",
      data: {
        payment,
      },
    });
  };