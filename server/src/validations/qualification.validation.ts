import { z } from "zod";

// ============================================================
// COMMON HELPERS
// ============================================================

const objectIdSchema = z
  .string()
  .regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid MongoDB ObjectId"
  );

const questionTypeSchema = z.enum([
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "TEXT_ANSWER",
]);

const questionCategorySchema = z.enum([
  "ACCURACY",
  "RELEVANCE",
  "LANGUAGE",
  "REASONING",
  "SAFETY",
  "INSTRUCTION_FOLLOWING",
  "DOMAIN_KNOWLEDGE",
]);

const difficultySchema = z.enum([
  "EASY",
  "MEDIUM",
  "HARD",
]);

const qualificationStatusSchema = z.enum([
  "DRAFT",
  "PUBLISHED",
  "ACTIVE",
  "PAUSED",
  "ARCHIVED",
]);

// ============================================================
// OPTION
// ============================================================

const optionSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1)
    .max(10),

  text: z
    .string()
    .trim()
    .min(1)
    .max(5000),
});

// ============================================================
// QUESTION
// ============================================================

const questionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(
      1,
      "Question is required"
    )
    .max(10000),

  type: questionTypeSchema,

  category: questionCategorySchema,

  difficulty:
    difficultySchema.default("MEDIUM"),

  options: z
    .array(optionSchema)
    .default([]),

  correctAnswer: z.union([
    z.string(),
    z.array(z.string()),
  ]),

  referenceAnswer:
    z.string()
      .trim()
      .max(10000)
      .nullable()
      .optional(),

  keywords: z
    .array(
      z.string().trim().min(1)
    )
    .default([]),

  points: z
    .number()
    .int()
    .min(1)
    .default(1),

  attemptsAllowed: z
    .number()
    .int()
    .min(1)
    .max(10)
    .default(1),

  order: z
    .number()
    .int()
    .min(1),

  isActive:
    z.boolean().default(true),
});

// ============================================================
// LEARNING MATERIAL
// ============================================================

const learningMaterialSchema =
  z.object({
    title: z
      .string()
      .trim()
      .max(200)
      .default(""),

    content: z
      .string()
      .trim()
      .max(100000)
      .default(""),

    sections: z
      .array(
        z.object({
          title: z
            .string()
            .trim()
            .min(1)
            .max(200),

          content: z
            .string()
            .trim()
            .min(1)
            .max(30000),

          order: z
            .number()
            .int()
            .min(1),
        })
      )
      .default([]),
  });

// ============================================================
// ELIGIBILITY
// ============================================================

const eligibilitySchema =
  z.object({
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

    minimumExperience: z
      .number()
      .min(0)
      .default(0),

    maximumExperience:
      z.number()
        .min(0)
        .nullable()
        .default(null),

    countries: z
      .array(
        z.string().trim().min(1)
      )
      .default([]),

    requirements: z
      .array(
        z.string().trim().min(1)
      )
      .default([]),
  });

// ============================================================
// ASSESSMENT
// ============================================================

const assessmentSchema =
  z.object({
    durationMinutes: z
      .number()
      .int()
      .min(1)
      .default(30),

    maxAttempts: z
      .number()
      .int()
      .min(1)
      .max(20)
      .default(3),

    questionCount: z
      .number()
      .int()
      .min(1)
      .default(10),

    randomizeQuestions:
      z.boolean().default(true),

    randomizeOptions:
      z.boolean().default(true),

    allowBackNavigation:
      z.boolean().default(true),

    autoSubmit:
      z.boolean().default(false),
  });

// ============================================================
// SCORING
// ============================================================

const scoringSchema =
  z.object({
    passingScore: z
      .number()
      .min(0)
      .max(100)
      .default(80),

    autoEvaluation:
      z.boolean().default(true),

    humanReviewRequired:
      z.boolean().default(false),
  });

// ============================================================
// CREATE QUALIFICATION
// ============================================================

export const createQualificationSchema =
  z.object({
    title: z
      .string()
      .trim()
      .min(
        3,
        "Qualification title must be at least 3 characters"
      )
      .max(200),

    description: z
      .string()
      .trim()
      .min(
        10,
        "Qualification description must be at least 10 characters"
      )
      .max(10000),

    instructions: z
      .string()
      .trim()
      .max(30000)
      .default(""),

    project:
      objectIdSchema
        .nullable()
        .optional(),

    learningMaterial:
      learningMaterialSchema.default(
        () => ({
          title: "",
          content: "",
          sections: [],
        })
      ),

    eligibility:
      eligibilitySchema.default(
        () => ({
          skills: [],
          languages: [],
          minimumExperience: 0,
          maximumExperience: null,
          countries: [],
          requirements: [],
        })
      ),

    assessment:
      assessmentSchema.default(
        () => ({
          durationMinutes: 30,
          maxAttempts: 3,
          questionCount: 10,
          randomizeQuestions: true,
          randomizeOptions: true,
          allowBackNavigation: true,
          autoSubmit: false,
        })
      ),

    scoring:
      scoringSchema.default(
        () => ({
          passingScore: 80,
          autoEvaluation: true,
          humanReviewRequired: false,
        })
      ),

    questions: z
      .array(questionSchema)
      .default([]),

    status:
      qualificationStatusSchema
        .default("DRAFT"),
  });

// ============================================================
// UPDATE QUALIFICATION
// ============================================================

export const updateQualificationSchema =
  z.object({
    title: z
      .string()
      .trim()
      .min(3)
      .max(200)
      .optional(),

    description: z
      .string()
      .trim()
      .min(10)
      .max(10000)
      .optional(),

    instructions: z
      .string()
      .trim()
      .max(30000)
      .optional(),

    project:
      objectIdSchema
        .nullable()
        .optional(),

    learningMaterial:
      learningMaterialSchema
        .partial()
        .optional(),

    eligibility:
      eligibilitySchema
        .partial()
        .optional(),

    assessment:
      assessmentSchema
        .partial()
        .optional(),

    scoring:
      scoringSchema
        .partial()
        .optional(),

    questions:
      z.array(questionSchema)
        .optional(),

    status:
      qualificationStatusSchema
        .optional(),
  });

// ============================================================
// STATUS
// ============================================================

export const updateQualificationStatusSchema =
  z.object({
    status:
      qualificationStatusSchema,
  });

// ============================================================
// PARAMS
// ============================================================

export const qualificationIdParamSchema =
  z.object({
    qualificationId:
      objectIdSchema,
  });

// ============================================================
// START ATTEMPT
// ============================================================

export const startQualificationAttemptSchema =
  z.object({
    project:
      objectIdSchema.nullable().optional(),
  });

// ============================================================
// ANSWER QUESTION
// ============================================================

export const submitQualificationAnswerSchema =
  z.object({
    questionId:
      objectIdSchema,

    answer: z.union([
      z.string(),
      z.array(z.string()),
    ]),
  });

// ============================================================
// EXPORT TYPES
// ============================================================

export type CreateQualificationInput =
  z.infer<
    typeof createQualificationSchema
  >;

export type UpdateQualificationInput =
  z.infer<
    typeof updateQualificationSchema
  >;

export type UpdateQualificationStatusInput =
  z.infer<
    typeof updateQualificationStatusSchema
  >;

export type StartQualificationAttemptInput =
  z.infer<
    typeof startQualificationAttemptSchema
  >;

export type SubmitQualificationAnswerInput =
  z.infer<
    typeof submitQualificationAnswerSchema
  >;