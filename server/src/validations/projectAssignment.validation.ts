import { z } from "zod";

// ============================================================
// PROJECT ASSIGNMENT STATUS
// ============================================================

const projectAssignmentStatusSchema = z.enum([
  "PENDING",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "REMOVED",
]);

// ============================================================
// CREATE PROJECT ASSIGNMENT
// ============================================================

export const createProjectAssignmentSchema =
  z
    .object({
      project: z
        .string()
        .min(1, "Project ID is required"),

      contributor: z
        .string()
        .min(1, "Contributor ID is required"),

      qualification: z
        .string()
        .min(1)
        .nullable()
        .optional(),

      qualificationAttempt: z
        .string()
        .min(1)
        .nullable()
        .optional(),

      status: projectAssignmentStatusSchema
        .optional(),
    })
    .strict();

// ============================================================
// UPDATE PROJECT ASSIGNMENT
// ============================================================

export const updateProjectAssignmentSchema =
  z
    .object({
      status: projectAssignmentStatusSchema.optional(),
    })
    .strict();

// ============================================================
// PROJECT ASSIGNMENT ID
// ============================================================

export const projectAssignmentIdParamSchema =
  z.object({
    assignmentId: z
      .string()
      .min(1, "Assignment ID is required"),
  });

// ============================================================
// PROJECT ID
// ============================================================

export const projectAssignmentProjectIdParamSchema =
  z.object({
    projectId: z
      .string()
      .min(1, "Project ID is required"),
  });

// ============================================================
// CONTRIBUTOR ID
// ============================================================

export const projectAssignmentContributorIdParamSchema =
  z.object({
    contributorId: z
      .string()
      .min(1, "Contributor ID is required"),
  });

// ============================================================
// STATUS UPDATE
// ============================================================

export const projectAssignmentStatusUpdateSchema =
  z
    .object({
      status: projectAssignmentStatusSchema,
    })
    .strict();