import { z } from "zod";

// ============================================================
// OBJECT ID VALIDATION
// ============================================================

const objectIdSchema = z
  .string()
  .trim()
  .min(
    1,
    "ID is required"
  );

// ============================================================
// REVIEW DECISION
// ============================================================
//
// Final review decision is made by a human Reviewer/Admin.
//
// Possible decisions:
//
// APPROVED
// REJECTED
// REVISION
//
// ============================================================

const reviewDecisionEnum =
  z.enum([
    "APPROVED",
    "REJECTED",
    "REVISION",
  ]);

// ============================================================
// REVIEW SCORE
// ============================================================

const reviewScoreSchema =
  z
    .number()
    .min(
      0,
      "Score cannot be negative"
    )
    .max(
      100,
      "Score cannot exceed 100"
    )
    .nullable()
    .optional();

// ============================================================
// REVIEW CRITERION
// ============================================================

const reviewCriterionSchema =
  z.object({
    criterion: z
      .string()
      .trim()
      .min(
        1,
        "Criterion is required"
      )
      .max(
        1000,
        "Criterion cannot exceed 1000 characters"
      ),

    score: z
      .number()
      .min(
        0,
        "Criterion score cannot be negative"
      )
      .max(
        100,
        "Criterion score cannot exceed 100"
      ),

    feedback: z
      .string()
      .trim()
      .max(
        5000,
        "Criterion feedback cannot exceed 5000 characters"
      )
      .optional(),
  });

// ============================================================
// CREATE TASK REVIEW
// ============================================================
//
// IMPORTANT:
//
// Reviewer supplies the decision.
//
// The following fields are NOT accepted from the client:
//
// - reviewer
// - contributor
// - project
// - task status
// - submission status
// - review status
// - reviewedAt
//
// Reviewer identity comes from authenticated req.user.
//
// Task/submission/project/contributor relationships are verified
// inside taskReview.service.ts.
//
// ============================================================

export const createTaskReviewSchema =
  z.object({
    task:
      objectIdSchema,

    submission:
      objectIdSchema,

    decision:
      reviewDecisionEnum,

    score:
      reviewScoreSchema,

    feedback: z
      .string()
      .trim()
      .max(
        10000,
        "Review feedback cannot exceed 10000 characters"
      )
      .optional(),

    criteria:
      z
        .array(
          reviewCriterionSchema
        )
        .max(
          100,
          "Cannot submit more than 100 review criteria"
        )
        .default([]),
  });

// ============================================================
// UPDATE TASK REVIEW
// ============================================================
//
// A completed review should normally be immutable.
//
// This schema is provided only for workflows where the service
// explicitly allows updating a review.
//
// The service MUST enforce:
//
// - reviewer permission
// - review status
// - allowed decision transition
//
// ============================================================

export const updateTaskReviewSchema =
  z.object({
    decision:
      reviewDecisionEnum
        .optional(),

    score:
      reviewScoreSchema,

    feedback: z
      .string()
      .trim()
      .max(
        10000,
        "Review feedback cannot exceed 10000 characters"
      )
      .optional(),

    criteria:
      z
        .array(
          reviewCriterionSchema
        )
        .max(
          100,
          "Cannot submit more than 100 review criteria"
        )
        .optional(),
  });

// ============================================================
// TASK REVIEW ID PARAMETER
// ============================================================

export const taskReviewIdParamSchema =
  z.object({
    taskReviewId:
      objectIdSchema,
  });

// ============================================================
// TASK ID PARAMETER
// ============================================================

export const taskReviewTaskIdParamSchema =
  z.object({
    taskId:
      objectIdSchema,
  });

// ============================================================
// SUBMISSION ID PARAMETER
// ============================================================

export const taskReviewSubmissionIdParamSchema =
  z.object({
    submissionId:
      objectIdSchema,
  });

// ============================================================
// REVIEW QUERY
// ============================================================

export const taskReviewQuerySchema =
  z.object({
    taskId:
      objectIdSchema.optional(),

    submissionId:
      objectIdSchema.optional(),

    projectId:
      objectIdSchema.optional(),

    contributorId:
      objectIdSchema.optional(),

    reviewerId:
      objectIdSchema.optional(),

    decision:
      reviewDecisionEnum
        .optional(),

    status:
      z
        .enum([
          "PENDING",
          "COMPLETED",
        ])
        .optional(),

    page: z
      .coerce
      .number()
      .int()
      .min(1)
      .default(1),

    limit: z
      .coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20),
  });

// ============================================================
// EXPORT TYPES
// ============================================================

export type CreateTaskReviewInput =
  z.infer<
    typeof createTaskReviewSchema
  >;

export type UpdateTaskReviewInput =
  z.infer<
    typeof updateTaskReviewSchema
  >;

export type TaskReviewQueryInput =
  z.infer<
    typeof taskReviewQuerySchema
  >;

  // ============================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================
//
// Existing taskReview.controller.ts uses these names.
//
// ============================================================

export const completeTaskReviewSchema =
  createTaskReviewSchema;

export const taskReviewIdSchema =
  taskReviewIdParamSchema;