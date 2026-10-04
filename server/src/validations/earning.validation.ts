import { z } from "zod";

// ============================================================
// EARNING SCHEMAS
// ============================================================

const earningStatusSchema =
  z.enum([
    "PENDING",
    "AVAILABLE",
    "PROCESSING",
    "PAID",
    "FAILED",
    "CANCELLED",
  ]);

const earningSourceSchema =
  z.enum([
    "TASK",
    "BONUS",
    "ADJUSTMENT",
  ]);

// ============================================================
// CREATE EARNING
// ============================================================

export const createEarningSchema =
  z.object({
    contributor: z
      .string()
      .min(
        1,
        "Contributor ID is required"
      ),

    task: z
      .string()
      .min(1, "Task ID is required")
      .nullable()
      .optional(),

    submission: z
      .string()
      .min(
        1,
        "Task submission ID is required"
      )
      .nullable()
      .optional(),

    project: z
      .string()
      .min(
        1,
        "Project ID is required"
      ),

    source:
      earningSourceSchema
      .optional(),

    amount: z
      .number()
      .min(
        0,
        "Earning amount cannot be negative"
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
      earningStatusSchema
      .optional(),

    description: z
      .string()
      .trim()
      .max(
        1000,
        "Description cannot exceed 1000 characters"
      )
      .optional(),

    availableAt: z
      .string()
      .datetime()
      .nullable()
      .optional(),

    paidAt: z
      .string()
      .datetime()
      .nullable()
      .optional(),
  });

// ============================================================
// UPDATE EARNING
// ============================================================

export const updateEarningSchema =
  z
    .object({
      amount: z
        .number()
        .min(
          0,
          "Earning amount cannot be negative"
        )
        .optional(),

      currency: z
        .string()
        .trim()
        .min(3)
        .max(10)
        .optional(),

      source:
        earningSourceSchema
        .optional(),

      status:
        earningStatusSchema
        .optional(),

      description: z
        .string()
        .trim()
        .max(1000)
        .optional(),

      availableAt: z
        .string()
        .datetime()
        .nullable()
        .optional(),

      paidAt: z
        .string()
        .datetime()
        .nullable()
        .optional(),
    })
    .strict();

// ============================================================
// UPDATE EARNING STATUS
// ============================================================

export const updateEarningStatusSchema =
  z.object({
    status:
      earningStatusSchema,
  });

// ============================================================
// EARNING ID
// ============================================================

export const earningIdSchema =
  z.object({
    earningId: z
      .string()
      .min(
        1,
        "Earning ID is required"
      ),
  });