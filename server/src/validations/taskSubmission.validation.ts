import { z } from "zod";

// ============================================================
// TASK SUBMISSION STATUS
// ============================================================

const taskSubmissionStatusSchema =
  z.enum([
    "DRAFT",
    "SUBMITTED",
    "UNDER_REVIEW",
    "APPROVED",
    "REJECTED",
    "REVISION",
  ]);

// ============================================================
// BOUNDING BOX VALIDATION
// ============================================================

const boundingBoxSchema = z.object({
  label: z
    .string()
    .trim()
    .min(
      1,
      "Bounding box label is required"
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
    .min(
      0,
      "Bounding box width cannot be negative"
    ),

  height: z
    .number()
    .min(
      0,
      "Bounding box height cannot be negative"
    ),
});

// ============================================================
// EVALUATION CRITERION VALIDATION
// ============================================================

const evaluationCriterionSchema =
  z.object({
    criterion: z
      .string()
      .trim()
      .min(
        1,
        "Evaluation criterion is required"
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
// RESPONSE VALIDATION
// ============================================================

const responseSchema = z.object({
  // ==========================================================
  // GENERAL ANSWER
  // ==========================================================

  answer: z
    .string()
    .optional(),

  // ==========================================================
  // CLASSIFICATION
  // ==========================================================

  selectedLabel: z
    .string()
    .trim()
    .optional(),

  // ==========================================================
  // RANKING
  // ==========================================================

  ranking: z
    .array(
      z.string().trim()
    )
    .optional(),

  // ==========================================================
  // TEXT REWRITE
  // ==========================================================

  rewrittenText: z
    .string()
    .optional(),

  // ==========================================================
  // AUDIO TRANSCRIPTION
  // ==========================================================

  transcription: z
    .string()
    .optional(),

  // ==========================================================
  // CODE
  // ==========================================================

  code: z
    .string()
    .optional(),

  // ==========================================================
  // IMAGE BOUNDING BOX
  // ==========================================================

  boundingBoxes: z
    .array(
      boundingBoxSchema
    )
    .optional(),

  // ==========================================================
  // EVALUATION
  // ==========================================================

  evaluation: z
    .object({
      score: z
        .number()
        .min(0)
        .max(100)
        .nullable()
        .optional(),

      criteria: z
        .array(
          evaluationCriterionSchema
        )
        .optional(),
    })
    .optional(),
});

// ============================================================
// CREATE TASK SUBMISSION
// ============================================================

export const createTaskSubmissionSchema =
  z.object({
    // ==========================================================
    // TASK
    // ==========================================================

    task: z
      .string()
      .min(
        1,
        "Task ID is required"
      ),

    // ==========================================================
    // PROJECT
    // ==========================================================

    project: z
      .string()
      .min(
        1,
        "Project ID is required"
      ),

    // ==========================================================
    // DATASET
    // ==========================================================

    dataset: z
      .string()
      .min(
        1,
        "Dataset ID is required"
      ),

    // ==========================================================
    // DATASET ITEM
    // ==========================================================

    datasetItem: z
      .string()
      .min(
        1,
        "Dataset item ID is required"
      ),

    // ==========================================================
    // ATTEMPT NUMBER
    // ==========================================================

    attemptNumber: z
      .number()
      .int()
      .min(
        1,
        "Attempt number must be at least 1"
      ),

    // ==========================================================
    // RESPONSE
    // ==========================================================

    response: responseSchema,

    // ==========================================================
    // FEEDBACK
    // ==========================================================

    feedback: z
      .string()
      .trim()
      .max(
        10000,
        "Feedback cannot exceed 10000 characters"
      )
      .optional(),

    // ==========================================================
    // STATUS
    // ==========================================================

    status: taskSubmissionStatusSchema
      .optional(),
  });

// ============================================================
// UPDATE TASK SUBMISSION
// ============================================================

export const updateTaskSubmissionSchema =
  z
    .object({
      // ========================================================
      // RESPONSE
      // ========================================================

      response: responseSchema
        .optional(),

      // ========================================================
      // FEEDBACK
      // ========================================================

      feedback: z
        .string()
        .trim()
        .max(
          10000,
          "Feedback cannot exceed 10000 characters"
        )
        .optional(),

      // ========================================================
      // STATUS
      // ========================================================

      status: taskSubmissionStatusSchema
        .optional(),
    })
    .strict();

// ============================================================
// SUBMIT TASK SUBMISSION
// ============================================================

export const submitTaskSubmissionSchema =
  z.object({
    response: responseSchema,

    feedback: z
      .string()
      .trim()
      .max(
        10000,
        "Feedback cannot exceed 10000 characters"
      )
      .optional(),
  });

// ============================================================
// TASK SUBMISSION ID VALIDATION
// ============================================================

export const taskSubmissionIdSchema =
  z.object({
    taskSubmissionId: z
      .string()
      .min(
        1,
        "Task submission ID is required"
      ),
  });