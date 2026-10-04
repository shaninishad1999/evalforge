import { z } from "zod";

// ============================================================
// TASK TYPES
// ============================================================

const taskTypeSchema = z.enum([
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

const taskStatusSchema = z.enum([
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
// CREATE TASK VALIDATION
// ============================================================

export const createTaskSchema = z.object({
  // ==========================================================
  // PROJECT
  // ==========================================================

  project: z
    .string()
    .min(1, "Project ID is required"),

  // ==========================================================
  // DATASET
  // ==========================================================

  dataset: z
    .string()
    .min(1, "Dataset ID is required"),

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
  // TASK TYPE
  // ==========================================================

  type: taskTypeSchema,

  // ==========================================================
  // TITLE
  // ==========================================================

  title: z
    .string()
    .trim()
    .min(
      3,
      "Task title must be at least 3 characters"
    )
    .max(
      300,
      "Task title cannot exceed 300 characters"
    ),

  // ==========================================================
  // INSTRUCTIONS
  // ==========================================================

  instructions: z
    .string()
    .trim()
    .min(
      10,
      "Task instructions must be at least 10 characters"
    )
    .max(
      30000,
      "Task instructions cannot exceed 30000 characters"
    ),

  // ==========================================================
  // PROMPT
  // ==========================================================

  prompt: z
    .string()
    .trim()
    .max(
      30000,
      "Task prompt cannot exceed 30000 characters"
    )
    .optional(),

  // ==========================================================
  // EVALUATION CRITERIA
  // ==========================================================

  evaluationCriteria: z
    .array(
      z
        .string()
        .trim()
        .min(
          1,
          "Evaluation criteria cannot be empty"
        )
    )
    .optional(),

  // ==========================================================
  // CONFIGURATION
  // ==========================================================

  configuration: z
    .object({
      maxAttempts: z
        .number()
        .int()
        .min(
          1,
          "Maximum attempts must be at least 1"
        )
        .optional(),

      timeLimitMinutes: z
        .number()
        .int()
        .min(
          1,
          "Time limit must be at least 1 minute"
        )
        .nullable()
        .optional(),

      reviewRequired: z
        .boolean()
        .optional(),
    })
    .optional(),

  // ==========================================================
  // REWARD
  // ==========================================================

  reward: z.object({
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
        3,
        "Currency is required"
      )
      .max(
        10,
        "Currency cannot exceed 10 characters"
      )
      .optional(),
  }),

  // ==========================================================
  // STATUS
  // ==========================================================

  status: taskStatusSchema
    .optional(),
});

// ============================================================
// UPDATE TASK VALIDATION
// ============================================================

export const updateTaskSchema = z
  .object({
    // ==========================================================
    // TASK TYPE
    // ==========================================================

    type: taskTypeSchema
      .optional(),

    // ==========================================================
    // TITLE
    // ==========================================================

    title: z
      .string()
      .trim()
      .min(3)
      .max(300)
      .optional(),

    // ==========================================================
    // INSTRUCTIONS
    // ==========================================================

    instructions: z
      .string()
      .trim()
      .min(10)
      .max(30000)
      .optional(),

    // ==========================================================
    // PROMPT
    // ==========================================================

    prompt: z
      .string()
      .trim()
      .max(30000)
      .optional(),

    // ==========================================================
    // EVALUATION CRITERIA
    // ==========================================================

    evaluationCriteria: z
      .array(
        z
          .string()
          .trim()
          .min(1)
      )
      .optional(),

    // ==========================================================
    // CONFIGURATION
    // ==========================================================

    configuration: z
      .object({
        maxAttempts: z
          .number()
          .int()
          .min(1)
          .optional(),

        timeLimitMinutes: z
          .number()
          .int()
          .min(1)
          .nullable()
          .optional(),

        reviewRequired: z
          .boolean()
          .optional(),
      })
      .optional(),

    // ==========================================================
    // REWARD
    // ==========================================================

    reward: z
      .object({
        amount: z
          .number()
          .min(0)
          .optional(),

        currency: z
          .string()
          .trim()
          .min(3)
          .max(10)
          .optional(),
      })
      .optional(),

    // ==========================================================
    // STATUS
    // ==========================================================

    status: taskStatusSchema
      .optional(),
  })
  .strict();

// ============================================================
// TASK STATUS UPDATE VALIDATION
// ============================================================

export const updateTaskStatusSchema =
  z.object({
    status: taskStatusSchema,
  });

// ============================================================
// TASK ID VALIDATION
// ============================================================

export const taskIdSchema = z.object({
  taskId: z
    .string()
    .min(
      1,
      "Task ID is required"
    ),
});