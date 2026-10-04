import { z } from "zod";

// ============================================================
// WALLET SCHEMAS
// ============================================================

const walletStatusSchema =
  z.enum([
    "ACTIVE",
    "SUSPENDED",
    "CLOSED",
  ]);

// ============================================================
// CREATE WALLET
// ============================================================

export const createWalletSchema =
  z.object({
    contributor: z
      .string()
      .min(
        1,
        "Contributor ID is required"
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
      walletStatusSchema
      .optional(),
  });

// ============================================================
// UPDATE WALLET
// ============================================================

export const updateWalletSchema =
  z
    .object({
      currency: z
        .string()
        .trim()
        .min(3)
        .max(10)
        .optional(),

      status:
        walletStatusSchema
        .optional(),
    })
    .strict();

// ============================================================
// UPDATE WALLET STATUS
// ============================================================

export const updateWalletStatusSchema =
  z.object({
    status:
      walletStatusSchema,
  });

// ============================================================
// WALLET ID
// ============================================================

export const walletIdSchema =
  z.object({
    walletId: z
      .string()
      .min(
        1,
        "Wallet ID is required"
      ),
  });

// ============================================================
// CONTRIBUTOR ID
// ============================================================

export const walletContributorIdSchema =
  z.object({
    contributorId: z
      .string()
      .min(
        1,
        "Contributor ID is required"
      ),
  });