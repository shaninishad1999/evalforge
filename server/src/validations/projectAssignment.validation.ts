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
// PROJECT ASSIGNMENT STATUS
// ============================================================
//
// Full status enum is used for query/update validation.
//
// Actual transition rules are enforced inside
// projectAssignment.service.ts.
//
// ============================================================

const projectAssignmentStatusEnum =
  z.enum([
    "PENDING",
    "ACTIVE",
    "PAUSED",
    "COMPLETED",
    "REMOVED",
  ]);

// ============================================================
// CREATE ASSIGNMENT STATUS
// ============================================================
//
// SECURITY:
//
// A new assignment can ONLY start as:
//
// PENDING
// ACTIVE
//
// It cannot be directly created as:
//
// PAUSED
// COMPLETED
// REMOVED
//
// ============================================================

const createAssignmentStatusEnum =
  z.enum([
    "PENDING",
    "ACTIVE",
  ]);

// ============================================================
// CREATE PROJECT ASSIGNMENT
// ============================================================
//
// Management roles create assignments.
//
// The service additionally verifies:
//
// - project ownership
// - contributor role
// - contributor active status
// - project status
// - qualification
// - qualification attempt
// - duplicate assignment
//
// ============================================================

export const createProjectAssignmentSchema =
  z.object({
    project:
      objectIdSchema,

    contributor:
      objectIdSchema,

    qualification:
      objectIdSchema
        .nullable()
        .optional(),

    qualificationAttempt:
      objectIdSchema
        .nullable()
        .optional(),

    status:
      createAssignmentStatusEnum
        .optional(),
  });

// ============================================================
// UPDATE PROJECT ASSIGNMENT
// ============================================================
//
// Status transition itself is NOT decided by Zod.
//
// The service checks the current status and applies the allowed
// state transition.
//
// Example:
//
// PENDING → ACTIVE
// ACTIVE → PAUSED
// PAUSED → ACTIVE
// ACTIVE → COMPLETED
// ACTIVE → REMOVED
//
// Contributor-specific restrictions are also enforced inside
// projectAssignment.service.ts.
//
// ============================================================

export const updateProjectAssignmentSchema =
  z.object({
    status:
      projectAssignmentStatusEnum,
  });

// ============================================================
// UPDATE ASSIGNMENT STATUS
// ============================================================
//
// Kept as a separate schema for routes that explicitly use
// /:assignmentId/status.
//
// ============================================================

export const updateProjectAssignmentStatusSchema =
  z.object({
    status:
      projectAssignmentStatusEnum,
  });

// ============================================================
// ASSIGNMENT ID PARAMETER
// ============================================================

export const projectAssignmentIdParamSchema =
  z.object({
    assignmentId:
      objectIdSchema,
  });

// ============================================================
// PROJECT ID PARAMETER
// ============================================================

export const projectAssignmentProjectIdParamSchema =
  z.object({
    projectId:
      objectIdSchema,
  });

// ============================================================
// GET MY ASSIGNMENTS QUERY
// ============================================================

export const myProjectAssignmentQuerySchema =
  z.object({
    status:
      projectAssignmentStatusEnum
        .optional(),
  });

// ============================================================
// GET PROJECT ASSIGNMENTS QUERY
// ============================================================

export const projectAssignmentQuerySchema =
  z.object({
    status:
      projectAssignmentStatusEnum
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

export type CreateProjectAssignmentInput =
  z.infer<
    typeof createProjectAssignmentSchema
  >;

export type UpdateProjectAssignmentInput =
  z.infer<
    typeof updateProjectAssignmentSchema
  >;

export type UpdateProjectAssignmentStatusInput =
  z.infer<
    typeof updateProjectAssignmentStatusSchema
  >;

export type ProjectAssignmentQueryInput =
  z.infer<
    typeof projectAssignmentQuerySchema
  >;

export type MyProjectAssignmentQueryInput =
  z.infer<
    typeof myProjectAssignmentQuerySchema
  >;
  // ============================================================
// BACKWARD COMPATIBILITY EXPORT
// ============================================================
//
// Existing controller uses:
// projectAssignmentStatusUpdateSchema
//
// Keep this alias so existing controller code does not need
// unnecessary changes.
//

export const projectAssignmentStatusUpdateSchema =
  updateProjectAssignmentStatusSchema;