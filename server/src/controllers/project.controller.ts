import { Response } from "express";

import {
  AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

import {
  createProject,
  getProjectById,
  getProjects,
  updateProject,
  changeProjectStatus,
  archiveProject,
} from "../services/project.service.js";

import {
  createProjectSchema,
  updateProjectSchema,
  updateProjectStatusSchema,
  projectIdParamSchema,
} from "../validations/project.validation.js";

import asyncHandler from "../utils/asyncHandler.js";

// ============================================================
// CREATE PROJECT
// ============================================================

export const createProjectController = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    // ========================================================
    // AUTH USER
    // ========================================================

    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // ========================================================
    // VALIDATE REQUEST BODY
    // ========================================================

    const validatedData =
      createProjectSchema.parse(req.body);

    // ========================================================
    // CREATE PROJECT
    // ========================================================

    const project = await createProject(
      user.userId,
      user.role,
      validatedData
    );

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: {
        project,
      },
    });
  }
);

// ============================================================
// GET ALL PROJECTS
// ============================================================

export const getProjectsController = asyncHandler(
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    // ========================================================
    // AUTH USER
    // ========================================================

    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // ========================================================
    // GET PROJECTS
    // ========================================================

    const projects = await getProjects(
      user.userId,
      user.role
    );

    return res.status(200).json({
      success: true,
      message: "Projects fetched successfully",
      data: {
        projects,
      },
    });
  }
);

// ============================================================
// GET PROJECT BY ID
// ============================================================

export const getProjectByIdController =
  asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response
    ) => {
      // ======================================================
      // VALIDATE PROJECT ID
      // ======================================================

      const { projectId } =
        projectIdParamSchema.parse(req.params);

      // ======================================================
      // GET AUTH USER
      // ======================================================

      const user = req.user;

      // ======================================================
      // GET PROJECT
      // ======================================================

      const project =
        await getProjectById(
          projectId,
          user?.userId,
          user?.role
        );

      return res.status(200).json({
        success: true,
        message: "Project fetched successfully",
        data: {
          project,
        },
      });
    }
  );

// ============================================================
// UPDATE PROJECT
// ============================================================

export const updateProjectController =
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
          message: "Authentication required",
        });
      }

      // ======================================================
      // VALIDATE PROJECT ID
      // ======================================================

      const { projectId } =
        projectIdParamSchema.parse(req.params);

      // ======================================================
      // VALIDATE REQUEST BODY
      // ======================================================

      const validatedData =
        updateProjectSchema.parse(req.body);

      // ======================================================
      // UPDATE PROJECT
      // ======================================================

      const project =
        await updateProject(
          projectId,
          user.userId,
          user.role,
          validatedData
        );

      return res.status(200).json({
        success: true,
        message: "Project updated successfully",
        data: {
          project,
        },
      });
    }
  );

// ============================================================
// CHANGE PROJECT STATUS
// ============================================================

export const changeProjectStatusController =

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
          message: "Authentication required",
        });
      }

      // ======================================================
      // VALIDATE PROJECT ID
      // ======================================================

      const { projectId } =
        projectIdParamSchema.parse(req.params);

      // ======================================================
      // VALIDATE STATUS
      // ======================================================

      const { status } =
        updateProjectStatusSchema.parse(
          req.body
        );

      // ======================================================
      // CHANGE STATUS
      // ======================================================

      const project =
        await changeProjectStatus(
          projectId,
          user.userId,
          user.role,
          status
        );

      return res.status(200).json({
        success: true,
        message: `Project status changed to ${status}`,
        data: {
          project,
        },
      });
    }
  );

// ============================================================
// ARCHIVE PROJECT
// ============================================================

export const archiveProjectController =
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
          message: "Authentication required",
        });
      }

      // ======================================================
      // VALIDATE PROJECT ID
      // ======================================================

      const { projectId } =
        projectIdParamSchema.parse(req.params);

      // ======================================================
      // ARCHIVE PROJECT
      // ======================================================

      const project =
        await archiveProject(
          projectId,
          user.userId,
          user.role
        );

      return res.status(200).json({
        success: true,
        message: "Project archived successfully",
        data: {
          project,
        },
      });
    }
  );