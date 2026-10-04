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
// RANKING ITEM
// ============================================================
//
// IMPORTANT:
//
// TaskSubmission model uses:
//
// ranking: string[]
//
// Therefore ranking must remain string[].
//
// Do NOT use:
//
// { item: string; rank: number }[]
//
// ============================================================

// ============================================================
// BOUNDING BOX
// ============================================================

const boundingBoxSchema =
  z.object({
    label: z
      .string()
      .trim()
      .min(
        1,
        "Bounding box label is required"
      )
      .max(
        500,
        "Bounding box label cannot exceed 500 characters"
      ),

    x: z
      .number()
      .min(
        0,
        "X coordinate cannot be negative"
      ),

    y: z
      .number()
      .min(
        0,
        "Y coordinate cannot be negative"
      ),

    width: z
      .number()
      .positive(
        "Bounding box width must be greater than 0"
      ),

    height: z
      .number()
      .positive(
        "Bounding box height must be greater than 0"
      ),
  });

// ============================================================
// EVALUATION CRITERION RESPONSE
// ============================================================

const evaluationCriterionSchema =
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
        "Score cannot be negative"
      )
      .max(
        100,
        "Score cannot exceed 100"
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
// EVALUATION RESPONSE
// ============================================================

const evaluationSchema =
  z.object({
    score: z
      .number()
      .min(
        0,
        "Evaluation score cannot be negative"
      )
      .max(
        100,
        "Evaluation score cannot exceed 100"
      )
      .nullable()
      .optional(),

    criteria: z
      .array(
        evaluationCriterionSchema
      )
      .default([]),
  });

// ============================================================
// SUBMISSION RESPONSE
// ============================================================
//
// Different task types can use different response fields.
//
// The service will additionally validate that the response
// matches the actual task type.
//
// ============================================================

const responseSchema =
  z.object({
    answer: z
      .string()
      .max(
        50000,
        "Answer cannot exceed 50000 characters"
      )
      .optional(),

    selectedLabel: z
      .string()
      .trim()
      .max(
        1000,
        "Selected label cannot exceed 1000 characters"
      )
      .optional(),

    // ========================================================
    // IMPORTANT
    //
    // ranking is string[]
    //
    // Example:
    //
    // ["Option A", "Option C", "Option B"]
    //
    // ========================================================

    ranking: z
      .array(
        z
          .string()
          .trim()
          .min(
            1,
            "Ranking item is required"
          )
          .max(
            1000,
            "Ranking item cannot exceed 1000 characters"
          )
      )
      .max(
        1000,
        "Ranking cannot contain more than 1000 items"
      )
      .optional(),

    rewrittenText: z
      .string()
      .max(
        50000,
        "Rewritten text cannot exceed 50000 characters"
      )
      .optional(),

    transcription: z
      .string()
      .max(
        100000,
        "Transcription cannot exceed 100000 characters"
      )
      .optional(),

    code: z
      .string()
      .max(
        100000,
        "Code cannot exceed 100000 characters"
      )
      .optional(),

    boundingBoxes: z
      .array(
        boundingBoxSchema
      )
      .max(
        1000,
        "Cannot submit more than 1000 bounding boxes"
      )
      .optional(),

    evaluation:
      evaluationSchema.optional(),
  });

// ============================================================
// CREATE TASK SUBMISSION
// ============================================================
//
// SECURITY:
//
// The client/contributor CANNOT submit:
//
// - status
// - contributor
// - reviewedAt
// - revisionRequestedAt
//
// Task/project/contributor ownership is verified by the
// service.
//
// attemptNumber is accepted as input but the service MUST
// verify that it is valid and does not exceed task limits.
//
// ============================================================

export const createTaskSubmissionSchema =
  z.object({
    task:
      objectIdSchema,

    project:
      objectIdSchema,

    dataset:
      objectIdSchema,

    datasetItem:
      objectIdSchema,

    attemptNumber: z
      .number()
      .int()
      .min(
        1,
        "Attempt number must be at least 1"
      ),

    response:
      responseSchema,

    feedback: z
      .string()
      .trim()
      .max(
        10000,
        "Feedback cannot exceed 10000 characters"
      )
      .optional(),

    // ========================================================
    // IMPORTANT
    // ========================================================
    //
    // status intentionally NOT accepted.
    //
    // New submission always starts as DRAFT.
    //
  });

// ============================================================
// UPDATE TASK SUBMISSION
// ============================================================
//
// Contributor can only edit their own draft/revision
// submission.
//
// Status is NOT accepted here.
//
// ============================================================

export const updateTaskSubmissionSchema =
  z.object({
    response:
      responseSchema.optional(),

    feedback: z
      .string()
      .trim()
      .max(
        10000,
        "Feedback cannot exceed 10000 characters"
      )
      .optional(),

    // ========================================================
    // NO STATUS
    // ========================================================
    //
    // status must be controlled by the submission service.
    //
  });

// ============================================================
// SUBMIT TASK SUBMISSION
// ============================================================
//
// Final submission request.
//
// Server changes:
//
// DRAFT / REVISION
//        ↓
// SUBMITTED
//
// The client cannot choose the resulting status.
//
// ============================================================

export const submitTaskSubmissionSchema =
  z.object({
    response:
      responseSchema.optional(),

    feedback: z
      .string()
      .trim()
      .max(
        10000,
        "Feedback cannot exceed 10000 characters"
      )
      .optional(),

    // ========================================================
    // NO STATUS
    // ========================================================
  });

// ============================================================
// MARK UNDER REVIEW
// ============================================================
//
// Only Reviewer/Admin workflow should call this endpoint.
//
// Status is intentionally NOT supplied by the client.
//
// Server sets:
//
// SUBMITTED → UNDER_REVIEW
//
// ============================================================

export const markTaskSubmissionUnderReviewSchema =
  z.object({
    // No client-controlled workflow fields.
  });

// ============================================================
// TASK SUBMISSION ID PARAMETER
// ============================================================

export const taskSubmissionIdParamSchema =
  z.object({
    taskSubmissionId:
      objectIdSchema,
  });

// ============================================================
// TASK ID PARAMETER
// ============================================================

export const taskSubmissionTaskIdParamSchema =
  z.object({
    taskId:
      objectIdSchema,
  });

// ============================================================
// SUBMISSION LIST QUERY
// ============================================================

export const taskSubmissionQuerySchema =
  z.object({
    taskId:
      objectIdSchema.optional(),

    projectId:
      objectIdSchema.optional(),

    contributorId:
      objectIdSchema.optional(),

    status: z
      .enum([
        "DRAFT",
        "SUBMITTED",
        "UNDER_REVIEW",
        "APPROVED",
        "REJECTED",
        "REVISION",
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

export type CreateTaskSubmissionInput =
  z.infer<
    typeof createTaskSubmissionSchema
  >;

export type UpdateTaskSubmissionInput =
  z.infer<
    typeof updateTaskSubmissionSchema
  >;

export type SubmitTaskSubmissionInput =
  z.infer<
    typeof submitTaskSubmissionSchema
  >;

export type TaskSubmissionQueryInput =
  z.infer<
    typeof taskSubmissionQuerySchema
  >;