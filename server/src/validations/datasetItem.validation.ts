import { z } from "zod";

// ============================================================
// DATASET ITEM TYPES
// ============================================================

const datasetItemTypeSchema = z.enum([
  "TEXT",
  "IMAGE",
  "AUDIO",
  "VIDEO",
  "CODE",
]);

const datasetItemStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "READY",
  "PUBLISHED",
  "IN_PROGRESS",
  "COMPLETED",
  "FAILED",
  "ARCHIVED",
]);

// ============================================================
// CREATE DATASET ITEM VALIDATION
// ============================================================

export const createDatasetItemSchema = z.object({
  // ==========================================================
  // DATASET
  // ==========================================================

  dataset: z
    .string()
    .min(1, "Dataset ID is required"),

  // ==========================================================
  // PROJECT
  // ==========================================================

  project: z
    .string()
    .min(1, "Project ID is required"),

  // ==========================================================
  // EXTERNAL ID
  // ==========================================================

  externalId: z
    .string()
    .trim()
    .max(
      200,
      "External ID cannot exceed 200 characters"
    )
    .optional()
    .nullable(),

  // ==========================================================
  // ITEM TYPE
  // ==========================================================

  type: datasetItemTypeSchema,

  // ==========================================================
  // CONTENT
  // ==========================================================

  content: z
    .object({
      text: z
        .string()
        .optional(),

      imageUrl: z
        .string()
        .trim()
        .optional(),

      audioUrl: z
        .string()
        .trim()
        .optional(),

      videoUrl: z
        .string()
        .trim()
        .optional(),

      code: z
        .string()
        .optional(),
    })
    .optional(),

  // ==========================================================
  // METADATA
  // ==========================================================

  metadata: z
    .record(z.string(), z.unknown())
    .optional(),

  // ==========================================================
  // STATUS
  // ==========================================================

  status: datasetItemStatusSchema
    .optional(),
});

// ============================================================
// UPDATE DATASET ITEM VALIDATION
// ============================================================

export const updateDatasetItemSchema = z
  .object({
    // ==========================================================
    // EXTERNAL ID
    // ==========================================================

    externalId: z
      .string()
      .trim()
      .max(
        200,
        "External ID cannot exceed 200 characters"
      )
      .optional()
      .nullable(),

    // ==========================================================
    // ITEM TYPE
    // ==========================================================

    type: datasetItemTypeSchema
      .optional(),

    // ==========================================================
    // CONTENT
    // ==========================================================

    content: z
      .object({
        text: z
          .string()
          .optional(),

        imageUrl: z
          .string()
          .trim()
          .optional(),

        audioUrl: z
          .string()
          .trim()
          .optional(),

        videoUrl: z
          .string()
          .trim()
          .optional(),

        code: z
          .string()
          .optional(),
      })
      .optional(),

    // ==========================================================
    // METADATA
    // ==========================================================

    metadata: z
      .record(z.string(), z.unknown())
      .optional(),

    // ==========================================================
    // STATUS
    // ==========================================================

    status: datasetItemStatusSchema
      .optional(),
  })
  .strict();

// ============================================================
// DATASET ITEM ID VALIDATION
// ============================================================

export const datasetItemIdSchema = z.object({
  datasetItemId: z
    .string()
    .min(
      1,
      "Dataset item ID is required"
    ),
});