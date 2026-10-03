import { z } from "zod";

// ============================================================
// PROJECT ENUMS
// ============================================================

const projectStatusSchema = z.enum([
  "DRAFT",
  "PUBLISHED",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "ARCHIVED",
]);

const rewardTypeSchema = z.enum([
  "PER_TASK",
  "PER_HOUR",
  "FIXED",
]);

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
// COMMON HELPERS
// ============================================================

const objectIdSchema = z
  .string()
  .regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid MongoDB ObjectId"
  );

const dateSchema = z.coerce.date();

// ============================================================
// CREATE PROJECT VALIDATION
// ============================================================

export const createProjectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(
      3,
      "Project title must be at least 3 characters"
    )
    .max(
      200,
      "Project title cannot exceed 200 characters"
    ),

  description: z
    .string()
    .trim()
    .min(
      10,
      "Project description must be at least 10 characters"
    )
    .max(
      10000,
      "Project description cannot exceed 10000 characters"
    ),

  projectManager:
    objectIdSchema.nullable().optional(),

  requirements: z
    .object({
      skills: z
        .array(
          z.string().trim().min(1)
        )
        .default([]),

      languages: z
        .array(
          z.string().trim().min(1)
        )
        .default([]),

      minExperience: z
        .number()
        .min(
          0,
          "Minimum experience cannot be negative"
        )
        .default(0),

      maxExperience: z
        .number()
        .min(
          0,
          "Maximum experience cannot be negative"
        )
        .nullable()
        .optional(),

      eligibility: z
        .array(
          z.string().trim().min(1)
        )
        .default([]),
    })
    .default(() => ({
      skills: [],
      languages: [],
      minExperience: 0,
      maxExperience: null,
      eligibility: [],
    })),

  guidelines: z
    .object({
      instructions: z
        .string()
        .trim()
        .max(
          30000,
          "Instructions cannot exceed 30000 characters"
        )
        .default(""),

      qualityRules: z
        .array(
          z.string().trim().min(1)
        )
        .default([]),
    })
    .default(() => ({
      instructions: "",
      qualityRules: [],
    })),

  taskConfiguration: z
    .object({
      taskTypes: z
        .array(taskTypeSchema)
        .min(
          1,
          "At least one task type is required"
        ),

      reviewRequired: z
        .boolean()
        .default(true),
    })
    .default(() => ({
      taskTypes: [],
      reviewRequired: true,
    })),

  rewardConfiguration: z.object({
    rewardType: rewardTypeSchema,

    rewardAmount: z
      .number()
      .positive(
        "Reward amount must be greater than 0"
      ),

    currency: z
      .string()
      .trim()
      .length(
        3,
        "Currency must be a 3-letter code"
      )
      .default("INR"),
  }),

  qualification: z
    .object({
      required: z
        .boolean()
        .default(false),

      qualificationId:
        objectIdSchema
          .nullable()
          .optional(),

      passingScore: z
        .number()
        .min(0)
        .max(100)
        .default(70),
    })
    .default(() => ({
      required: false,
      qualificationId: null,
      passingScore: 70,
    })),

  status:
    projectStatusSchema.default("DRAFT"),

  startDate:
    dateSchema.nullable().optional(),

  endDate:
    dateSchema.nullable().optional(),
});

// ============================================================
// UPDATE PROJECT VALIDATION
// ============================================================

export const updateProjectSchema = z.object({
  // ==========================================================
  // BASIC PROJECT FIELDS
  // ==========================================================

  title: z
    .string()
    .trim()
    .min(
      3,
      "Project title must be at least 3 characters"
    )
    .max(
      200,
      "Project title cannot exceed 200 characters"
    )
    .optional(),

  description: z
    .string()
    .trim()
    .min(
      10,
      "Project description must be at least 10 characters"
    )
    .max(
      10000,
      "Project description cannot exceed 10000 characters"
    )
    .optional(),

  projectManager:
    objectIdSchema.nullable().optional(),

  // ==========================================================
  // REQUIREMENTS
  // ==========================================================

  requirements: z
    .object({
      skills: z
        .array(
          z.string().trim().min(1)
        )
        .optional(),

      languages: z
        .array(
          z.string().trim().min(1)
        )
        .optional(),

      minExperience: z
        .number()
        .min(
          0,
          "Minimum experience cannot be negative"
        )
        .optional(),

      maxExperience: z
        .number()
        .min(
          0,
          "Maximum experience cannot be negative"
        )
        .nullable()
        .optional(),

      eligibility: z
        .array(
          z.string().trim().min(1)
        )
        .optional(),
    })
    .optional(),

  // ==========================================================
  // GUIDELINES
  // ==========================================================

  guidelines: z
    .object({
      instructions: z
        .string()
        .trim()
        .max(
          30000,
          "Instructions cannot exceed 30000 characters"
        )
        .optional(),

      qualityRules: z
        .array(
          z.string().trim().min(1)
        )
        .optional(),
    })
    .optional(),

  // ==========================================================
  // TASK CONFIGURATION
  // ==========================================================

  taskConfiguration: z
    .object({
      taskTypes: z
        .array(taskTypeSchema)
        .optional(),

      reviewRequired: z
        .boolean()
        .optional(),
    })
    .optional(),

  // ==========================================================
  // REWARD CONFIGURATION
  // ==========================================================

  rewardConfiguration: z
    .object({
      rewardType:
        rewardTypeSchema.optional(),

      rewardAmount: z
        .number()
        .positive(
          "Reward amount must be greater than 0"
        )
        .optional(),

      currency: z
        .string()
        .trim()
        .length(
          3,
          "Currency must be a 3-letter code"
        )
        .optional(),
    })
    .optional(),

  // ==========================================================
  // QUALIFICATION
  // ==========================================================

  qualification: z
    .object({
      required: z
        .boolean()
        .optional(),

      qualificationId:
        objectIdSchema
          .nullable()
          .optional(),

      passingScore: z
        .number()
        .min(0)
        .max(100)
        .optional(),
    })
    .optional(),

  // ==========================================================
  // PROJECT STATUS
  // ==========================================================

  status:
    projectStatusSchema.optional(),

  // ==========================================================
  // PROJECT DATES
  // ==========================================================

  startDate:
    dateSchema.nullable().optional(),

  endDate:
    dateSchema.nullable().optional(),
});

// ============================================================
// PROJECT STATUS VALIDATION
// ============================================================

export const updateProjectStatusSchema =
  z.object({
    status: projectStatusSchema,
  });

// ============================================================
// PROJECT ID VALIDATION
// ============================================================

export const projectIdParamSchema =
  z.object({
    projectId: objectIdSchema,
  });

// ============================================================
// TYPES
// ============================================================

export type CreateProjectInput =
  z.infer<
    typeof createProjectSchema
  >;

export type UpdateProjectInput =
  z.infer<
    typeof updateProjectSchema
  >;

export type UpdateProjectStatusInput =
  z.infer<
    typeof updateProjectStatusSchema
  >;