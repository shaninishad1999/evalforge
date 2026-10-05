import {
  Response,
} from "express";

import {
  pauseTask,
  resumeTask,
} from "../services/taskPause.service.js";

import ApiError from "../utils/ApiError.js";

import asyncHandler from "../utils/asyncHandler.js";

import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

// ============================================================
// PAUSE TASK
// ============================================================
//
// POST /api/tasks/:taskId/pause
//
// Only the contributor who currently owns the task can pause it.
//
// ============================================================

export const pauseTaskController =
  asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response
    ) => {
      // ==========================================================
      // CHECK AUTHENTICATED USER
      // ==========================================================

      if (!req.user) {
        throw new ApiError(
          401,
          "Authentication required"
        );
      }

      // ==========================================================
      // GET TASK ID
      // ==========================================================

      const taskId =
        req.params.taskId;

      if (
        typeof taskId !== "string"
      ) {
        throw new ApiError(
          400,
          "Invalid task ID"
        );
      }

      // ==========================================================
      // GET CONTRIBUTOR ID
      // ==========================================================

      const contributorId =
        req.user.userId;

      // ==========================================================
      // PAUSE TASK
      // ==========================================================

      const task =
        await pauseTask(
          taskId,
          contributorId
        );

      // ==========================================================
      // RESPONSE
      // ==========================================================

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Task paused successfully",

          data: {
            task,
          },
        });
    }
  );

// ============================================================
// RESUME TASK
// ============================================================
//
// POST /api/tasks/:taskId/resume
//
// Contributor manually resumes the paused task.
//
// ============================================================

export const resumeTaskController =
  asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response
    ) => {
      // ==========================================================
      // CHECK AUTHENTICATED USER
      // ==========================================================

      if (!req.user) {
        throw new ApiError(
          401,
          "Authentication required"
        );
      }

      // ==========================================================
      // GET TASK ID
      // ==========================================================

      const taskId =
        req.params.taskId;

      if (
        typeof taskId !== "string"
      ) {
        throw new ApiError(
          400,
          "Invalid task ID"
        );
      }

      // ==========================================================
      // GET CONTRIBUTOR ID
      // ==========================================================

      const contributorId =
        req.user.userId;

      // ==========================================================
      // RESUME TASK
      // ==========================================================

      const task =
        await resumeTask(
          taskId,
          contributorId
        );

      // ==========================================================
      // RESPONSE
      // ==========================================================

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Task resumed successfully",

          data: {
            task,
          },
        });
    }
  );