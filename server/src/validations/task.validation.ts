import { z } from "zod";

// ============================================================
// TASK TYPES
// ============================================================

const taskTypeEnum = z.enum([
  "TEXT_CLASSIFICATION",
  "TEXT_RANKING",
  "TEXT_EVALUATION",
  "TEXT_REWRITE",
  "IMAGE_CLASSIFICATION",
  "IMAGE_BOUNDING_BOX",
  "IMAGE_EVALUATION",
  "AUDIO_TRANSCRIPTION",
  "AUDIO_EVALUATION",
  "VIDEO_EVALUATION",
  "CODE_REVIEW",
  "CODE_EVALUATION",
]);

// ============================================================
// TASK STATUS
// ============================================================
//
// Status is kept here for management status endpoint validation.
//
// IMPORTANT:
// createTask/updateTask must NOT accept status.
// Task lifecycle is controlled by task.service.ts.
//
// ============================================================

const taskStatusEnum = z.enum([
  "CREATED",
  "AVAILABLE",
  "CLAIMED",
  "IN_PROGRESS",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "REVISION",
]);

// ============================================================
// REWARD VALIDATION
// ============================================================

const rewardSchema = z.object({
  amount: z
    .number()
    .min(
      0,
      "Reward amount cannot be negative"
    ),

  currency: z
    .string()
    .trim()
    .min(
      1,
      "Currency is required"
    )
    .max(10)
    .default("INR"),
});

// ============================================================
// TASK CONFIGURATION
// ============================================================

const taskConfigurationSchema =
  z.object({
    maxAttempts: z
      .number()
      .int()
      .min(
        1,
        "Maximum attempts must be at least 1"
      )
      .max(
        100,
        "Maximum attempts cannot exceed 100"
      )
      .default(1),

    timeLimitMinutes: z
      .number()
      .int()
      .positive()
      .nullable()
      .optional(),

    reviewRequired: z
      .boolean()
      .default(true),
  });

// ============================================================
// CREATE TASK VALIDATION
// ============================================================
//
// SECURITY:
// Do NOT accept `status` here.
//
// A newly created task must always start as CREATED.
// The service controls the lifecycle.
//
// Also do NOT accept:
// - claimedBy
// - claimedAt
// - startedAt
// - submittedAt
// - reviewedAt
//
// These are server-controlled workflow fields.
//
// ============================================================

export const createTaskSchema =
  z.object({
    project: z
      .string()
      .min(
        1,
        "Project ID is required"
      ),

    dataset: z
      .string()
      .min(
        1,
        "Dataset ID is required"
      ),

    datasetItem: z
      .string()
      .min(
        1,
        "Dataset item ID is required"
      ),

    type: taskTypeEnum,

    title: z
      .string()
      .trim()
      .min(
        1,
        "Task title is required"
      )
      .max(
        200,
        "Task title cannot exceed 200 characters"
      ),

    instructions: z
      .string()
      .trim()
      .min(
        1,
        "Task instructions are required"
      )
      .max(
        10000,
        "Task instructions cannot exceed 10000 characters"
      ),

    prompt: z
      .string()
      .trim()
      .min(
        1,
        "Task prompt is required"
      )
      .max(
        50000,
        "Task prompt cannot exceed 50000 characters"
      ),

    evaluationCriteria: z
      .array(
        z
          .string()
          .trim()
          .min(
            1,
            "Evaluation criterion cannot be empty"
          )
          .max(
            1000,
            "Evaluation criterion cannot exceed 1000 characters"
          )
      )
      .default([]),

    configuration:
      taskConfigurationSchema
        .optional(),

    reward:
      rewardSchema,

    // ========================================================
    // STATUS IS INTENTIONALLY NOT ACCEPTED
    // ========================================================
    //
    // status must always start as CREATED.
    //
  });

// ============================================================
// UPDATE TASK VALIDATION
// ============================================================
//
// SECURITY:
// `status` is intentionally excluded.
//
// Use PATCH /:taskId/status for controlled lifecycle changes.
//
// Also excludes server-controlled fields:
//
// - claimedBy
// - claimedAt
// - startedAt
// - submittedAt
// - reviewedAt
//
// ============================================================

export const updateTaskSchema =
  z.object({
    project: z
      .string()
      .min(
        1,
        "Project ID is required"
      )
      .optional(),

    dataset: z
      .string()
      .min(
        1,
        "Dataset ID is required"
      )
      .optional(),

    datasetItem: z
      .string()
      .min(
        1,
        "Dataset item ID is required"
      )
      .optional(),

    type:
      taskTypeEnum.optional(),

    title: z
      .string()
      .trim()
      .min(
        1,
        "Task title cannot be empty"
      )
      .max(
        200,
        "Task title cannot exceed 200 characters"
      )
      .optional(),

    instructions: z
      .string()
      .trim()
      .min(
        1,
        "Task instructions cannot be empty"
      )
      .max(
        10000,
        "Task instructions cannot exceed 10000 characters"
      )
      .optional(),

    prompt: z
      .string()
      .trim()
      .min(
        1,
        "Task prompt cannot be empty"
      )
      .max(
        50000,
        "Task prompt cannot exceed 50000 characters"
      )
      .optional(),

    evaluationCriteria:
      z
        .array(
          z
            .string()
            .trim()
            .min(
              1,
              "Evaluation criterion cannot be empty"
            )
            .max(
              1000,
              "Evaluation criterion cannot exceed 1000 characters"
            )
        )
        .optional(),

    configuration:
      taskConfigurationSchema
        .optional(),

    reward:
      rewardSchema.optional(),

    // ========================================================
    // IMPORTANT
    // ========================================================
    //
    // Do NOT add:
    //
    // status
    // claimedBy
    // claimedAt
    // startedAt
    // submittedAt
    // reviewedAt
    //
    // These are controlled by workflow services.
    //
  });

// ============================================================
// UPDATE TASK STATUS VALIDATION
// ============================================================
//
// This endpoint is only for server-authorized management/workflow
// status changes.
//
// The service MUST still validate the actual transition.
// Validation alone is not enough.
//
// ============================================================

export const updateTaskStatusSchema =
  z.object({
    status:
      taskStatusEnum,
  });

// ============================================================
// TASK ID PARAMETER VALIDATION
// ============================================================

export const taskIdParamSchema =
  z.object({
    taskId: z
      .string()
      .min(
        1,
        "Task ID is required"
      ),
  });

// ============================================================
// PROJECT ID PARAMETER VALIDATION
// ============================================================

export const projectIdParamSchema =
  z.object({
    projectId: z
      .string()
      .min(
        1,
        "Project ID is required"
      ),
  });

// ============================================================
// TASK LIST QUERY VALIDATION
// ============================================================

export const taskQuerySchema =
  z.object({
    projectId: z
      .string()
      .optional(),

    datasetId: z
      .string()
      .optional(),

    status:
      taskStatusEnum.optional(),

    type:
      taskTypeEnum.optional(),

    claimedBy: z
      .string()
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

export type CreateTaskInput =
  z.infer<
    typeof createTaskSchema
  >;

export type UpdateTaskInput =
  z.infer<
    typeof updateTaskSchema
  >;

export type UpdateTaskStatusInput =
  z.infer<
    typeof updateTaskStatusSchema
  >;

export type TaskQueryInput =
  z.infer<
    typeof taskQuerySchema
  >;