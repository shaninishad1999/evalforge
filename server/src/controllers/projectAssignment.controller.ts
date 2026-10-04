import { Response } from "express";

import {
  AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

import {
  createProjectAssignment,
  getProjectAssignmentById,
  getMyProjectAssignments,
  getProjectAssignments,
  updateProjectAssignment,
  removeProjectAssignment,
} from "../services/projectAssignment.service.js";

import {
  createProjectAssignmentSchema,
  updateProjectAssignmentSchema,
  projectAssignmentIdParamSchema,
  projectAssignmentProjectIdParamSchema,
  projectAssignmentStatusUpdateSchema,
} from "../validations/projectAssignment.validation.js";

import asyncHandler from "../utils/asyncHandler.js";

// ============================================================
// CREATE PROJECT ASSIGNMENT
// ============================================================

export const createProjectAssignmentController =
  asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response
    ) => {
      // ======================================================
      // AUTH USER
      // ======================================================

      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      // ======================================================
      // VALIDATE REQUEST BODY
      // ======================================================

      const validatedData =
        createProjectAssignmentSchema.parse(
          req.body
        );

      // ======================================================
      // CREATE ASSIGNMENT
      // ======================================================

      const assignment =
        await createProjectAssignment(
          user.userId,
          user.role,
          validatedData
        );

      return res.status(201).json({
        success: true,
        message:
          "Project assignment created successfully",
        data: {
          assignment,
        },
      });
    }
  );

// ============================================================
// GET ASSIGNMENT BY ID
// ============================================================

export const getProjectAssignmentByIdController =
  asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response
    ) => {
      // ======================================================
      // AUTH USER
      // ======================================================

      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      // ======================================================
      // VALIDATE ASSIGNMENT ID
      // ======================================================

      const { assignmentId } =
        projectAssignmentIdParamSchema.parse(
          req.params
        );

      // ======================================================
      // GET ASSIGNMENT
      // ======================================================

      const assignment =
        await getProjectAssignmentById(
          assignmentId,
          user.userId,
          user.role
        );

      return res.status(200).json({
        success: true,
        message:
          "Project assignment fetched successfully",
        data: {
          assignment,
        },
      });
    }
  );

// ============================================================
// GET MY ASSIGNMENTS
// ============================================================

export const getMyProjectAssignmentsController =
  asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response
    ) => {
      // ======================================================
      // AUTH USER
      // ======================================================

      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      // ======================================================
      // OPTIONAL STATUS
      // ======================================================

      const status =
        typeof req.query.status ===
        "string"
          ? req.query.status
          : undefined;

      // ======================================================
      // GET ASSIGNMENTS
      // ======================================================

      const assignments =
        await getMyProjectAssignments(
          user.userId,
          status as any
        );

      return res.status(200).json({
        success: true,
        message:
          "My project assignments fetched successfully",
        data: {
          assignments,
        },
      });
    }
  );

// ============================================================
// GET PROJECT ASSIGNMENTS
// ============================================================

export const getProjectAssignmentsController =
  asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response
    ) => {
      // ======================================================
      // AUTH USER
      // ======================================================

      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      // ======================================================
      // VALIDATE PROJECT ID
      // ======================================================

      const { projectId } =
        projectAssignmentProjectIdParamSchema.parse(
          req.params
        );

      // ======================================================
      // OPTIONAL STATUS
      // ======================================================

      const status =
        typeof req.query.status ===
        "string"
          ? req.query.status
          : undefined;

      // ======================================================
      // GET ASSIGNMENTS
      // ======================================================

      const assignments =
        await getProjectAssignments(
          projectId,
          user.userId,
          user.role,
          status as any
        );

      return res.status(200).json({
        success: true,
        message:
          "Project assignments fetched successfully",
        data: {
          assignments,
        },
      });
    }
  );

// ============================================================
// UPDATE ASSIGNMENT
// ============================================================

export const updateProjectAssignmentController =
  asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response
    ) => {
      // ======================================================
      // AUTH USER
      // ======================================================

      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      // ======================================================
      // VALIDATE ASSIGNMENT ID
      // ======================================================

      const { assignmentId } =
        projectAssignmentIdParamSchema.parse(
          req.params
        );

      // ======================================================
      // VALIDATE BODY
      // ======================================================

      const validatedData =
        updateProjectAssignmentSchema.parse(
          req.body
        );

      // ======================================================
      // UPDATE ASSIGNMENT
      // ======================================================

      const assignment =
        await updateProjectAssignment(
          assignmentId,
          user.userId,
          user.role,
          validatedData
        );

      return res.status(200).json({
        success: true,
        message:
          "Project assignment updated successfully",
        data: {
          assignment,
        },
      });
    }
  );

// ============================================================
// CHANGE ASSIGNMENT STATUS
// ============================================================

export const changeProjectAssignmentStatusController =
  asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response
    ) => {
      // ======================================================
      // AUTH USER
      // ======================================================

      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      // ======================================================
      // VALIDATE ASSIGNMENT ID
      // ======================================================

      const { assignmentId } =
        projectAssignmentIdParamSchema.parse(
          req.params
        );

      // ======================================================
      // VALIDATE STATUS
      // ======================================================

      const { status } =
        projectAssignmentStatusUpdateSchema.parse(
          req.body
        );

      // ======================================================
      // UPDATE STATUS
      // ======================================================

      const assignment =
        await updateProjectAssignment(
          assignmentId,
          user.userId,
          user.role,
          {
            status,
          }
        );

      return res.status(200).json({
        success: true,
        message:
          `Project assignment status changed to ${status}`,
        data: {
          assignment,
        },
      });
    }
  );

// ============================================================
// REMOVE ASSIGNMENT
// ============================================================

export const removeProjectAssignmentController =
  asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response
    ) => {
      // ======================================================
      // AUTH USER
      // ======================================================

      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      // ======================================================
      // VALIDATE ASSIGNMENT ID
      // ======================================================

      const { assignmentId } =
        projectAssignmentIdParamSchema.parse(
          req.params
        );

      // ======================================================
      // REMOVE ASSIGNMENT
      // ======================================================

      const assignment =
        await removeProjectAssignment(
          assignmentId,
          user.userId,
          user.role
        );

      return res.status(200).json({
        success: true,
        message:
          "Project assignment removed successfully",
        data: {
          assignment,
        },
      });
    }
  );