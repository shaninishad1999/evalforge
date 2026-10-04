import { z } from "zod";

// ============================================================
// WITHDRAWAL SCHEMAS
// ============================================================

const withdrawalStatusSchema =
  z.enum([
    "PENDING",
    "PROCESSING",
    "PAID",
    "FAILED",
    "CANCELLED",
  ]);

const withdrawalMethodSchema =
  z.enum([
    "BANK_TRANSFER",
    "UPI",
    "PAYPAL",
    "AIRTm",
  ]);

// ============================================================
// PAYMENT DETAILS
// ============================================================

const paymentDetailsSchema =
  z.object({
    accountHolderName: z
      .string()
      .trim()
      .max(200)
      .optional(),

    accountNumber: z
      .string()
      .trim()
      .max(100)
      .optional(),

    ifscCode: z
      .string()
      .trim()
      .max(20)
      .optional(),

    upiId: z
      .string()
      .trim()
      .max(200)
      .optional(),

    paypalEmail: z
      .string()
      .trim()
      .email(
        "Invalid PayPal email"
      )
      .optional(),
  })
  .optional();

// ============================================================
// CREATE WITHDRAWAL
// ============================================================

export const createWithdrawalSchema =
  z.object({
    wallet: z
      .string()
      .min(
        1,
        "Wallet ID is required"
      ),

    amount: z
      .number()
      .positive(
        "Withdrawal amount must be greater than 0"
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

    method:
      withdrawalMethodSchema,

    paymentDetails:
      paymentDetailsSchema,
  });

// ============================================================
// UPDATE WITHDRAWAL
// ============================================================

export const updateWithdrawalSchema =
  z
    .object({
      amount: z
        .number()
        .positive(
          "Withdrawal amount must be greater than 0"
        )
        .optional(),

      currency: z
        .string()
        .trim()
        .min(3)
        .max(10)
        .optional(),

      method:
        withdrawalMethodSchema
        .optional(),

      paymentDetails:
        paymentDetailsSchema,

      transactionId: z
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
    })
    .strict();

// ============================================================
// UPDATE WITHDRAWAL STATUS
// ============================================================

export const updateWithdrawalStatusSchema =
  z.object({
    status:
      withdrawalStatusSchema,

    transactionId: z
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
// WITHDRAWAL ID
// ============================================================

export const withdrawalIdSchema =
  z.object({
    withdrawalId: z
      .string()
      .min(
        1,
        "Withdrawal ID is required"
      ),
  });

// ============================================================
// CONTRIBUTOR WITHDRAWALS
// ============================================================

export const withdrawalContributorIdSchema =
  z.object({
    contributorId: z
      .string()
      .min(
        1,
        "Contributor ID is required"
      ),
  });