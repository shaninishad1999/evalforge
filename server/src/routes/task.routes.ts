import { Router } from "express";

import {
  authenticate,
} from "../middleware/auth.middleware.js";

import asyncHandler from "../utils/asyncHandler.js";

import {
  getAllTasks,
  getTask,
  createNewTask,
  updateExistingTask,
  updateExistingTaskStatus,
  claimAvailableTask,
  startClaimedTask,
  publishAvailableTask,
} from "../controllers/task.controller.js";

import {
  pauseTaskController,
  resumeTaskController,
} from "../controllers/taskPause.controller.js";

// ============================================================
// ROUTER
// ============================================================

const router = Router();

// ============================================================
// AUTHENTICATION
// ============================================================

router.use(authenticate);

// ============================================================
// GET ALL TASKS
// ============================================================

router.get(
  "/",
  asyncHandler(getAllTasks)
);

// ============================================================
// CREATE TASK
// ============================================================

router.post(
  "/",
  asyncHandler(createNewTask)
);

// ============================================================
// GET TASK BY ID
// ============================================================

router.get(
  "/:taskId",
  asyncHandler(getTask)
);

// ============================================================
// UPDATE TASK
// ============================================================

router.patch(
  "/:taskId",
  asyncHandler(updateExistingTask)
);

// ============================================================
// UPDATE TASK STATUS
// ============================================================

router.patch(
  "/:taskId/status",
  asyncHandler(updateExistingTaskStatus)
);

// ============================================================
// CLAIM TASK
// ============================================================

router.post(
  "/:taskId/claim",
  asyncHandler(claimAvailableTask)
);

// ============================================================
// START TASK
// ============================================================

router.post(
  "/:taskId/start",
  asyncHandler(startClaimedTask)
);

// ============================================================
// PAUSE TASK
// ============================================================

router.post(
  "/:taskId/pause",
  asyncHandler(pauseTaskController)
);

// ============================================================
// RESUME TASK
// ============================================================

router.post(
  "/:taskId/resume",
  asyncHandler(resumeTaskController)
);

// ============================================================
// PUBLISH TASK
// ============================================================

router.post(
  "/:taskId/publish",
  asyncHandler(publishAvailableTask)
);

// ============================================================
// EXPORT
// ============================================================

export default router;