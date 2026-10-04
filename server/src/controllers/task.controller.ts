import { Response } from "express";

import {
  AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

import ApiError from "../utils/ApiError.js";

import {
  createTask,
  getTaskById,
  getTasks,
  updateTask,
  updateTaskStatus,
  claimTask,
  startTask,
  publishTask,
} from "../services/task.service.js";

// ============================================================
// GET ALL TASKS
// ============================================================

export const getAllTasks = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    throw new ApiError(
      401,
      "Authentication required"
    );
  }

  const projectId =
    typeof req.query.projectId ===
    "string"
      ? req.query.projectId
      : undefined;

  const datasetId =
    typeof req.query.datasetId ===
    "string"
      ? req.query.datasetId
      : undefined;

  const status =
    typeof req.query.status ===
    "string"
      ? req.query.status
      : undefined;

  const type =
    typeof req.query.type ===
    "string"
      ? req.query.type
      : undefined;

  const tasks = await getTasks(
    req.user.userId,
    req.user.role,
    {
      projectId,
      datasetId,
      status,
      type,
    }
  );

  res.status(200).json({
    success: true,
    message:
      "Tasks fetched successfully",
    data: {
      tasks,
    },
  });
};

// ============================================================
// GET TASK BY ID
// ============================================================

export const getTask = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const taskId =
    typeof req.params.taskId ===
    "string"
      ? req.params.taskId
      : undefined;

  if (!taskId) {
    throw new ApiError(
      400,
      "Task ID is required"
    );
  }

  const task =
    await getTaskById(
      taskId,
      req.user?.userId,
      req.user?.role
    );

  res.status(200).json({
    success: true,
    message:
      "Task fetched successfully",
    data: {
      task,
    },
  });
};

// ============================================================
// CREATE TASK
// ============================================================

export const createNewTask = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    throw new ApiError(
      401,
      "Authentication required"
    );
  }

  const task =
    await createTask(
      req.user.userId,
      req.user.role,
      req.body
    );

  res.status(201).json({
    success: true,
    message:
      "Task created successfully",
    data: {
      task,
    },
  });
};

// ============================================================
// UPDATE TASK
// ============================================================

export const updateExistingTask =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required"
      );
    }

    const taskId =
      typeof req.params.taskId ===
      "string"
        ? req.params.taskId
        : undefined;

    if (!taskId) {
      throw new ApiError(
        400,
        "Task ID is required"
      );
    }

    const task =
      await updateTask(
        taskId,
        req.user.userId,
        req.user.role,
        req.body
      );

    res.status(200).json({
      success: true,
      message:
        "Task updated successfully",
      data: {
        task,
      },
    });
  };

// ============================================================
// UPDATE TASK STATUS
// ============================================================

export const updateExistingTaskStatus =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required"
      );
    }

    const taskId =
      typeof req.params.taskId ===
      "string"
        ? req.params.taskId
        : undefined;

    if (!taskId) {
      throw new ApiError(
        400,
        "Task ID is required"
      );
    }

    const task =
      await updateTaskStatus(
        taskId,
        req.user.userId,
        req.user.role,
        req.body
      );

    res.status(200).json({
      success: true,
      message:
        "Task status updated successfully",
      data: {
        task,
      },
    });
  };

// ============================================================
// CLAIM TASK
// ============================================================

export const claimAvailableTask =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required"
      );
    }

    if (
      req.user.role !==
      "CONTRIBUTOR"
    ) {
      throw new ApiError(
        403,
        "Only contributors can claim tasks"
      );
    }

    const taskId =
      typeof req.params.taskId ===
      "string"
        ? req.params.taskId
        : undefined;

    if (!taskId) {
      throw new ApiError(
        400,
        "Task ID is required"
      );
    }

    const task =
      await claimTask(
        taskId,
        req.user.userId
      );

    res.status(200).json({
      success: true,
      message:
        "Task claimed successfully",
      data: {
        task,
      },
    });
  };

// ============================================================
// START TASK
// ============================================================

export const startClaimedTask =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required"
      );
    }

    if (
      req.user.role !==
      "CONTRIBUTOR"
    ) {
      throw new ApiError(
        403,
        "Only contributors can start tasks"
      );
    }

    const taskId =
      typeof req.params.taskId ===
      "string"
        ? req.params.taskId
        : undefined;

    if (!taskId) {
      throw new ApiError(
        400,
        "Task ID is required"
      );
    }

    const task =
      await startTask(
        taskId,
        req.user.userId
      );

    res.status(200).json({
      success: true,
      message:
        "Task started successfully",
      data: {
        task,
      },
    });
  };

// ============================================================
// PUBLISH TASK
// ============================================================

export const publishAvailableTask =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required"
      );
    }

    const taskId =
      typeof req.params.taskId ===
      "string"
        ? req.params.taskId
        : undefined;

    if (!taskId) {
      throw new ApiError(
        400,
        "Task ID is required"
      );
    }

    const task =
      await publishTask(
        taskId,
        req.user.userId,
        req.user.role
      );

    res.status(200).json({
      success: true,
      message:
        "Task published successfully",
      data: {
        task,
      },
    });
  };