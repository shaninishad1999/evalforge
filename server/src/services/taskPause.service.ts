import mongoose from "mongoose";

import Task from "../models/Task.js";
import ProjectAssignment from "../models/ProjectAssignment.js";

import ApiError from "../utils/ApiError.js";

// ============================================================
// VALIDATE OBJECT ID
// ============================================================

const validateObjectId = (
  id: string,
  fieldName: string
) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(
      400,
      `Invalid ${fieldName}`
    );
  }
};

// ============================================================
// CHECK CONTRIBUTOR PROJECT ASSIGNMENT
// ============================================================
//
// Contributor must be assigned to the task's project.
//
// ============================================================

const checkProjectAssignment = async (
  task: any,
  contributorId: string
) => {
  const assignment =
    await ProjectAssignment.findOne({
      project: task.project,
      contributor: contributorId,
      status: {
        $in: [
          "PENDING",
          "ACTIVE",
        ],
      },
    });

  if (!assignment) {
    throw new ApiError(
      403,
      "You are not assigned to this project"
    );
  }

  return assignment;
};

// ============================================================
// PAUSE TASK
// ============================================================
//
// Contributor can pause only their own IN_PROGRESS task.
//
// Maximum pause duration comes from:
// task.configuration.maxPauseSeconds
//
// Minimum allowed pause duration:
// 1 second
//
// ============================================================

export const pauseTask = async (
  taskId: string,
  contributorId: string
) => {
  // ==========================================================
  // VALIDATE IDS
  // ==========================================================

  validateObjectId(
    taskId,
    "task ID"
  );

  validateObjectId(
    contributorId,
    "contributor ID"
  );

  // ==========================================================
  // FIND TASK
  // ==========================================================

  const task =
    await Task.findById(taskId);

  if (!task) {
    throw new ApiError(
      404,
      "Task not found"
    );
  }

  // ==========================================================
  // CHECK TASK OWNER
  // ==========================================================

  if (
    !task.claimedBy ||
    task.claimedBy.toString() !==
      contributorId
  ) {
    throw new ApiError(
      403,
      "This task is not assigned to you"
    );
  }

  // ==========================================================
  // CHECK PROJECT ASSIGNMENT
  // ==========================================================

  await checkProjectAssignment(
    task,
    contributorId
  );

  // ==========================================================
  // TASK MUST BE IN PROGRESS
  // ==========================================================

  if (
    task.status !==
    "IN_PROGRESS"
  ) {
    throw new ApiError(
      400,
      "Only tasks in progress can be paused"
    );
  }

  // ==========================================================
  // GET MAXIMUM PAUSE DURATION
  // ==========================================================

  const maxPauseSeconds =
    task.configuration
      ?.maxPauseSeconds;

  if (
    !maxPauseSeconds ||
    maxPauseSeconds < 1
  ) {
    throw new ApiError(
      400,
      "Pause is not configured for this task"
    );
  }

  // ==========================================================
  // CURRENT TIME
  // ==========================================================

  const now =
    new Date();

  // ==========================================================
  // CALCULATE PAUSE EXPIRATION
  // ==========================================================

  const pauseExpiresAt =
    new Date(
      now.getTime() +
        maxPauseSeconds * 1000
    );

  // ==========================================================
  // UPDATE TASK
  // ==========================================================

  task.status =
    "PAUSED";

  task.pauseStartedAt =
    now;

  task.pauseExpiresAt =
    pauseExpiresAt;

  task.pauseCount += 1;

  await task.save();

  // ==========================================================
  // RETURN TASK
  // ==========================================================

  return task;
};

// ============================================================
// RESUME TASK
// ============================================================
//
// Contributor manually resumes a paused task.
//
// Actual pause duration is calculated from:
// pauseStartedAt -> current time
//
// ============================================================

export const resumeTask = async (
  taskId: string,
  contributorId: string
) => {
  // ==========================================================
  // VALIDATE IDS
  // ==========================================================

  validateObjectId(
    taskId,
    "task ID"
  );

  validateObjectId(
    contributorId,
    "contributor ID"
  );

  // ==========================================================
  // FIND TASK
  // ==========================================================

  const task =
    await Task.findById(taskId);

  if (!task) {
    throw new ApiError(
      404,
      "Task not found"
    );
  }

  // ==========================================================
  // CHECK TASK OWNER
  // ==========================================================

  if (
    !task.claimedBy ||
    task.claimedBy.toString() !==
      contributorId
  ) {
    throw new ApiError(
      403,
      "This task is not assigned to you"
    );
  }

  // ==========================================================
  // CHECK PROJECT ASSIGNMENT
  // ==========================================================

  await checkProjectAssignment(
    task,
    contributorId
  );

  // ==========================================================
  // TASK MUST BE PAUSED
  // ==========================================================

  if (
    task.status !==
    "PAUSED"
  ) {
    throw new ApiError(
      400,
      "Only paused tasks can be resumed"
    );
  }

  // ==========================================================
  // CHECK PAUSE START TIME
  // ==========================================================

  if (
    !task.pauseStartedAt
  ) {
    throw new ApiError(
      400,
      "Pause start time is missing"
    );
  }

  // ==========================================================
  // CURRENT TIME
  // ==========================================================

  const now =
    new Date();

  // ==========================================================
  // CALCULATE ACTUAL PAUSE DURATION
  // ==========================================================

  const pauseDurationSeconds =
    Math.max(
      0,
      Math.floor(
        (
          now.getTime() -
          task.pauseStartedAt.getTime()
        ) / 1000
      )
    );

  // ==========================================================
  // UPDATE TOTAL PAUSED TIME
  // ==========================================================

  task.totalPausedSeconds +=
    pauseDurationSeconds;

  // ==========================================================
  // CLEAR PAUSE DATA
  // ==========================================================

  task.pauseStartedAt =
    null;

  task.pauseExpiresAt =
    null;

  // ==========================================================
  // RESUME TASK
  // ==========================================================

  task.status =
    "IN_PROGRESS";

  await task.save();

  // ==========================================================
  // RETURN TASK
  // ==========================================================

  return task;
};

// ============================================================
// AUTOMATICALLY RESUME EXPIRED PAUSED TASKS
// ============================================================
//
// This function will be called by the server-side timer worker.
//
// It finds PAUSED tasks whose pauseExpiresAt has passed.
//
// Example:
//
// maxPauseSeconds = 600
//
// Pause:
// 12:00:00
//
// Expires:
// 12:10:00
//
// At/after 12:10:00:
//
// PAUSED
//    ↓
// IN_PROGRESS
//
// ============================================================

export const resumeExpiredPausedTasks =
  async () => {
    const now =
      new Date();

    // ========================================================
    // FIND EXPIRED PAUSED TASKS
    // ========================================================

    const expiredTasks =
      await Task.find({
        status: "PAUSED",
        pauseExpiresAt: {
          $ne: null,
          $lte: now,
        },
      });

    // ========================================================
    // PROCESS EACH TASK
    // ========================================================

    for (const task of expiredTasks) {
      // ======================================================
      // SAFETY CHECK
      // ======================================================

      if (
        !task.pauseStartedAt ||
        !task.pauseExpiresAt
      ) {
        continue;
      }

      // ======================================================
      // CALCULATE ACTUAL PAUSE DURATION
      // ======================================================
      //
      // For automatic resume we count the configured
      // maximum pause duration.
      //
      // This prevents the duration from exceeding the
      // configured pause window.
      //
      // ======================================================

      const pauseDurationSeconds =
        Math.max(
          0,
          Math.floor(
            (
              task.pauseExpiresAt.getTime() -
              task.pauseStartedAt.getTime()
            ) / 1000
          )
        );

      // ======================================================
      // UPDATE TASK
      // ======================================================

      task.totalPausedSeconds +=
        pauseDurationSeconds;

      task.pauseStartedAt =
        null;

      task.pauseExpiresAt =
        null;

      task.status =
        "IN_PROGRESS";

      await task.save();
    }

    // ========================================================
    // RETURN NUMBER OF RESUMED TASKS
    // ========================================================

    return {
      resumedCount:
        expiredTasks.length,
    };
  };