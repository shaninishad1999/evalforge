import { z } from "zod";

// ============================================================
// PAYMENT SCHEMAS
// ============================================================

const paymentStatusSchema =
  z.enum([
    "PENDING",
    "PROCESSING",
    "SUCCESS",
    "FAILED",
    "REFUNDED",
    "CANCELLED",
  ]);

const paymentProviderSchema =
  z.enum([
    "RAZORPAY",
    "BANK_TRANSFER",
    "UPI",
    "PAYPAL",
    "AIRTm",
    "MANUAL",
  ]);

const paymentTypeSchema =
  z.enum([
    "WITHDRAWAL",
    "REFUND",
    "ADJUSTMENT",
  ]);

// ============================================================
// CREATE PAYMENT
// ============================================================

export const createPaymentSchema =
  z.object({
    contributor: z
      .string()
      .min(
        1,
        "Contributor ID is required"
      )
      .nullable()
      .optional(),

    withdrawal: z
      .string()
      .min(
        1,
        "Withdrawal ID is required"
      )
      .nullable()
      .optional(),

    wallet: z
      .string()
      .min(
        1,
        "Wallet ID is required"
      )
      .nullable()
      .optional(),

    type:
      paymentTypeSchema,

    provider:
      paymentProviderSchema,

    amount: z
      .number()
      .min(
        0,
        "Payment amount cannot be negative"
      ),

    currency: z
      .string()
      .trim()
      .min(
        3,
        "Currency is required"
      )
      .max(
        10,
        "Currency cannot exceed 10 characters"
      )
      .optional(),

    status:
      paymentStatusSchema
      .optional(),

    transactionId: z
      .string()
      .trim()
      .max(300)
      .nullable()
      .optional(),

    providerPaymentId: z
      .string()
      .trim()
      .max(300)
      .nullable()
      .optional(),

    providerOrderId: z
      .string()
      .trim()
      .max(300)
      .nullable()
      .optional(),

    providerResponse:
      z.record(
        z.string(),
        z.unknown()
      )
      .optional(),

    failureReason: z
      .string()
      .trim()
      .max(5000)
      .optional(),
  });

// ============================================================
// UPDATE PAYMENT
// ============================================================

export const updatePaymentSchema =
  z
    .object({
      provider:
        paymentProviderSchema
        .optional(),

      amount: z
        .number()
        .min(
          0,
          "Payment amount cannot be negative"
        )
        .optional(),

      currency: z
        .string()
        .trim()
        .min(3)
        .max(10)
        .optional(),

      transactionId: z
        .string()
        .trim()
        .max(300)
        .nullable()
        .optional(),

      providerPaymentId: z
        .string()
        .trim()
        .max(300)
        .nullable()
        .optional(),

      providerOrderId: z
        .string()
        .trim()
        .max(300)
        .nullable()
        .optional(),

      providerResponse:
        z.record(
          z.string(),
          z.unknown()
        )
        .optional(),

      failureReason: z
        .string()
        .trim()
        .max(5000)
        .optional(),
    })
    .strict();

// ============================================================
// UPDATE PAYMENT STATUS
// ============================================================

export const updatePaymentStatusSchema =
  z.object({
    status:
      paymentStatusSchema,

    transactionId: z
      .string()
      .trim()
      .max(300)
      .nullable()
      .optional(),

    providerPaymentId: z
      .string()
      .trim()
      .max(300)
      .nullable()
      .optional(),

    failureReason: z
      .string()
      .trim()
      .max(5000)
      .optional(),
  });

// ============================================================
// PAYMENT ID
// ============================================================

export const paymentIdSchema =
  z.object({
    paymentId: z
      .string()
      .min(
        1,
        "Payment ID is required"
      ),
  });

// ============================================================
// CONTRIBUTOR ID
// ============================================================

export const paymentContributorIdSchema =
  z.object({
    contributorId: z
      .string()
      .min(
        1,
        "Contributor ID is required"
      ),
  });