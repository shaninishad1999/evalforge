import { z } from "zod";

// ============================================================
// CREATE DATASET VALIDATION
// ============================================================

export const createDatasetSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Dataset name must be at least 3 characters")
    .max(200, "Dataset name cannot exceed 200 characters"),

  description: z
    .string()
    .trim()
    .min(10, "Dataset description must be at least 10 characters")
    .max(10000, "Dataset description cannot exceed 10000 characters"),

  project: z
    .string()
    .min(1, "Project ID is required"),

  type: z
    .enum([
      "TEXT",
      "IMAGE",
      "AUDIO",
      "VIDEO",
      "CODE",
      "MIXED",
    ])
    .default("TEXT"),

  source: z
    .object({
      name: z
        .string()
        .trim()
        .max(200)
        .optional(),

      description: z
        .string()
        .trim()
        .max(5000)
        .optional(),
    })
    .optional(),

  configuration: z
    .object({
      taskTypes: z
        .array(z.string())
        .optional(),

      totalItems: z
        .number()
        .int()
        .min(0)
        .optional(),
    })
    .optional(),
});

// ============================================================
// UPDATE DATASET VALIDATION
// ============================================================

export const updateDatasetSchema = z
  .object({
    name: z
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

    type: z
      .enum([
        "TEXT",
        "IMAGE",
        "AUDIO",
        "VIDEO",
        "CODE",
        "MIXED",
      ])
      .optional(),

    source: z
      .object({
        name: z
          .string()
          .trim()
          .max(200)
          .optional(),

        description: z
          .string()
          .trim()
          .max(5000)
          .optional(),
      })
      .optional(),

    configuration: z
      .object({
        taskTypes: z
          .array(z.string())
          .optional(),

        totalItems: z
          .number()
          .int()
          .min(0)
          .optional(),
      })
      .optional(),

    status: z
      .enum([
        "DRAFT",
        "PROCESSING",
        "READY",
        "PUBLISHED",
        "PAUSED",
        "COMPLETED",
        "ARCHIVED",
        "FAILED",
      ])
      .optional(),
  })
  .strict();

// ============================================================
// DATASET ID VALIDATION
// ============================================================

export const datasetIdSchema = z.object({
  datasetId: z.string().min(1, "Dataset ID is required"),
});