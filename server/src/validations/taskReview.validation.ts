import { z } from "zod";

// ============================================================
// TASK REVIEW SCHEMAS
// ============================================================

const taskReviewDecisionSchema =
  z.enum([
    "APPROVED",
    "REJECTED",
    "REVISION",
  ]);

const taskReviewStatusSchema =
  z.enum([
    "PENDING",
    "COMPLETED",
  ]);

// ============================================================
// REVIEW CRITERIA SCHEMA
// ============================================================

const reviewCriterionSchema =
  z.object({
    criterion: z
      .string()
      .trim()
      .min(
        1,
        "Review criterion is required"
      ),

    score: z
      .number()
      .min(0)
      .max(100),

    feedback: z
      .string()
      .trim()
      .max(
        10000,
        "Criterion feedback cannot exceed 10000 characters"
      )
      .optional(),
  });

// ============================================================
// CREATE TASK REVIEW
// ============================================================

export const createTaskReviewSchema =
  z.object({
    task: z
      .string()
      .min(
        1,
        "Task ID is required"
      ),

    submission: z
      .string()
      .min(
        1,
        "Task submission ID is required"
      ),

    decision:
      taskReviewDecisionSchema,

    score: z
      .number()
      .min(0)
      .max(100)
      .nullable()
      .optional(),

    feedback: z
      .string()
      .trim()
      .max(
        10000,
        "Feedback cannot exceed 10000 characters"
      )
      .optional(),

    criteria: z
      .array(reviewCriterionSchema)
      .optional(),

    status:
      taskReviewStatusSchema
      .optional(),
  });

// ============================================================
// UPDATE TASK REVIEW
// ============================================================

export const updateTaskReviewSchema =
  z
    .object({
      decision:
        taskReviewDecisionSchema
        .optional(),

      score: z
        .number()
        .min(0)
        .max(100)
        .nullable()
        .optional(),

      feedback: z
        .string()
        .trim()
        .max(
          10000,
          "Feedback cannot exceed 10000 characters"
        )
        .optional(),

      criteria: z
        .array(reviewCriterionSchema)
        .optional(),

      status:
        taskReviewStatusSchema
        .optional(),
    })
    .strict();

// ============================================================
// COMPLETE TASK REVIEW
// ============================================================

export const completeTaskReviewSchema =
  z.object({
    decision:
      taskReviewDecisionSchema,

    score: z
      .number()
      .min(0)
      .max(100)
      .nullable()
      .optional(),

    feedback: z
      .string()
      .trim()
      .max(
        10000,
        "Feedback cannot exceed 10000 characters"
      )
      .optional(),

    criteria: z
      .array(reviewCriterionSchema)
      .optional(),
  });

// ============================================================
// TASK REVIEW ID
// ============================================================

export const taskReviewIdSchema =
  z.object({
    taskReviewId: z
      .string()
      .min(
        1,
        "Task review ID is required"
      ),
  });