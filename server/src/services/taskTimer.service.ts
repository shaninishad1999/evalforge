import mongoose from "mongoose";
import Task from "../models/Task.js";
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
// GET ACTIVE TIME USED
// ============================================================
//
// This calculates only ACTIVE working time.
//
// PAUSED time is never counted as active time.
//
// Example:
//
// Task started      = 10:00
// Pause             = 10:10
// Resume            = 10:20
// Current time      = 10:30
//
// Active time       = 10 + 10 = 20 minutes
//
// ============================================================

export const getTaskActiveTimeSeconds = (
  task: any,
  now: Date = new Date()
): number => {
  if (!task.startedAt) {
    return 0;
  }

  const startedAt = task.startedAt.getTime();

  // Total elapsed time from task start
  const elapsedSeconds = Math.max(
    0,
    Math.floor(
      (now.getTime() - startedAt) / 1000
    )
  );

  // Total paused time already completed
  let pausedSeconds =
    task.totalPausedSeconds ?? 0;

  // If task is currently paused,
  // current pause duration should also be excluded.
  if (
    task.status === "PAUSED" &&
    task.pauseStartedAt
  ) {
    const currentPauseSeconds = Math.max(
      0,
      Math.floor(
        (now.getTime() -
          task.pauseStartedAt.getTime()) /
          1000
      )
    );

    pausedSeconds += currentPauseSeconds;
  }

  return Math.max(
    0,
    elapsedSeconds - pausedSeconds
  );
};

// ============================================================
// GET TASK TIME LIMIT
// ============================================================

export const getTaskTimeLimitSeconds = (
  task: any
): number | null => {
  const timeLimitMinutes =
    task.configuration?.timeLimitMinutes;

  if (
    timeLimitMinutes === null ||
    timeLimitMinutes === undefined
  ) {
    return null;
  }

  if (timeLimitMinutes <= 0) {
    return null;
  }

  return Math.floor(
    timeLimitMinutes * 60
  );
};

// ============================================================
// GET REMAINING ACTIVE TIME
// ============================================================

export const getTaskRemainingTimeSeconds = (
  task: any,
  now: Date = new Date()
): number | null => {
  const timeLimitSeconds =
    getTaskTimeLimitSeconds(task);

  // No time limit configured
  if (timeLimitSeconds === null) {
    return null;
  }

  const activeTimeSeconds =
    getTaskActiveTimeSeconds(
      task,
      now
    );

  return Math.max(
    0,
    timeLimitSeconds -
      activeTimeSeconds
  );
};

// ============================================================
// CHECK WHETHER TASK TIMER HAS EXPIRED
// ============================================================

export const isTaskTimerExpired = (
  task: any,
  now: Date = new Date()
): boolean => {
  const remainingSeconds =
    getTaskRemainingTimeSeconds(
      task,
      now
    );

  // No time limit = never expires
  if (remainingSeconds === null) {
    return false;
  }

  return remainingSeconds <= 0;
};

// ============================================================
// START TASK TIMER
// ============================================================
//
// Timer starts only when task moves from CLAIMED
// to IN_PROGRESS.
//
// startedAt is server-controlled.
//
// Client cannot control timer start time.
//

export const startTaskTimer = async (
  taskId: string,
  contributorId: string
) => {
  validateObjectId(
    taskId,
    "task ID"
  );

  validateObjectId(
    contributorId,
    "contributor ID"
  );

  const task = await Task.findById(
    taskId
  );

  if (!task) {
    throw new ApiError(
      404,
      "Task not found"
    );
  }

  if (
    task.claimedBy?.toString() !==
    contributorId
  ) {
    throw new ApiError(
      403,
      "This task is not assigned to you"
    );
  }

  if (
    task.status !== "CLAIMED"
  ) {
    throw new ApiError(
      400,
      "Only claimed tasks can be started"
    );
  }

  const now = new Date();

  task.status = "IN_PROGRESS";

  task.startedAt =
    task.startedAt ?? now;

  task.pauseStartedAt = null;
  task.pauseExpiresAt = null;

  await task.save();

  return task;
};

// ============================================================
// GET TASK TIMER
// ============================================================
//
// Returns server-calculated timer information.
//
// Frontend should use this response to display the timer.
//
// The frontend must NOT be the source of truth.
//

export const getTaskTimer = async (
  taskId: string,
  contributorId: string
) => {
  validateObjectId(
    taskId,
    "task ID"
  );

  validateObjectId(
    contributorId,
    "contributor ID"
  );

  const task = await Task.findById(
    taskId
  );

  if (!task) {
    throw new ApiError(
      404,
      "Task not found"
    );
  }

  if (
    task.claimedBy?.toString() !==
    contributorId
  ) {
    throw new ApiError(
      403,
      "This task is not assigned to you"
    );
  }

  const now = new Date();

  const activeTimeSeconds =
    getTaskActiveTimeSeconds(
      task,
      now
    );

  const timeLimitSeconds =
    getTaskTimeLimitSeconds(
      task
    );

  const remainingTimeSeconds =
    getTaskRemainingTimeSeconds(
      task,
      now
    );

  return {
    taskId: task._id,

    status: task.status,

    startedAt:
      task.startedAt,

    timeLimitSeconds,

    activeTimeSeconds,

    remainingTimeSeconds,

    totalPausedSeconds:
      task.totalPausedSeconds,

    pauseCount:
      task.pauseCount,

    pauseStartedAt:
      task.pauseStartedAt,

    pauseExpiresAt:
      task.pauseExpiresAt,

    isPaused:
      task.status === "PAUSED",

    isExpired:
      isTaskTimerExpired(
        task,
        now
      ),
  };
};

// ============================================================
// EXPIRE SINGLE TASK
// ============================================================
//
// This function is server-side protection.
//
// If active working time reaches the configured
// time limit, task is no longer allowed to continue.
//

export const expireTaskIfNeeded = async (
  taskId: string
) => {
  validateObjectId(
    taskId,
    "task ID"
  );

  const task = await Task.findById(
    taskId
  );

  if (!task) {
    throw new ApiError(
      404,
      "Task not found"
    );
  }

  // Already completed states do not need timer handling.
  if (
    [
      "SUBMITTED",
      "UNDER_REVIEW",
      "APPROVED",
      "REJECTED",
    ].includes(task.status)
  ) {
    return task;
  }

  // Paused task timer must NOT expire because
  // active time is stopped while paused.
  if (
    task.status === "PAUSED"
  ) {
    return task;
  }

  if (
    !isTaskTimerExpired(task)
  ) {
    return task;
  }

  // ==========================================================
  // TIMER EXPIRED
  // ==========================================================

  //
  // We move the task back to a controlled state.
  //
  // For now we use SUBMITTED because the contributor
  // can no longer continue working on the task.
  //
  // If later you want a dedicated EXPIRED status,
  // we can add it to Task.ts.
  //

  task.status = "SUBMITTED";

  task.submittedAt =
    task.submittedAt ??
    new Date();

  await task.save();

  return task;
};

// ============================================================
// CHECK AND EXPIRE ALL ACTIVE TASKS
// ============================================================
//
// This function can be called by a background worker / cron.
//
// It does NOT depend on the browser.
//
// Browser close/refresh does not reset the timer.
//

export const checkExpiredTasks =
  async () => {
    const tasks =
      await Task.find({
        status: {
          $in: [
            "IN_PROGRESS",
          ],
        },
        startedAt: {
          $ne: null,
        },
      });

    let expiredCount = 0;

    for (const task of tasks) {
      const timeLimitSeconds =
        getTaskTimeLimitSeconds(
          task
        );

      // No timer configured
      if (
        timeLimitSeconds === null
      ) {
        continue;
      }

      const expired =
        isTaskTimerExpired(
          task
        );

      if (!expired) {
        continue;
      }

      task.status = "SUBMITTED";

      task.submittedAt =
        task.submittedAt ??
        new Date();

      await task.save();

      expiredCount++;
    }

    return {
      checkedCount: tasks.length,
      expiredCount,
    };
  };

// ============================================================
// AUTO RESUME EXPIRED PAUSE
// ============================================================
//
// If client allows maxPauseSeconds = 600,
// the task can remain PAUSED for maximum 600 seconds.
//
// After that server automatically resumes it.
//
// IMPORTANT:
// The pause duration is added to totalPausedSeconds,
// therefore it will NOT count toward active work time.
//

export const resumeExpiredPausedTasks =
  async () => {
    const now = new Date();

    const pausedTasks =
      await Task.find({
        status: "PAUSED",

        pauseExpiresAt: {
          $ne: null,
          $lte: now,
        },
      });

    let resumedCount = 0;

    for (const task of pausedTasks) {
      if (
        !task.pauseStartedAt ||
        !task.pauseExpiresAt
      ) {
        continue;
      }

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

      task.totalPausedSeconds +=
        pauseDurationSeconds;

      task.pauseStartedAt = null;
      task.pauseExpiresAt = null;

      task.status = "IN_PROGRESS";

      await task.save();

      resumedCount++;
    }

    return {
      checkedCount:
        pausedTasks.length,

      resumedCount,
    };
  };

// ============================================================
// TASK TIMER WORKER
// ============================================================
//
// This worker runs on the backend.
//
// It checks:
//
// 1. Expired active tasks
// 2. Expired pauses
//
// Browser is NOT required.
//

let timerWorkerStarted = false;

export const startTaskTimerWorker =
  () => {
    if (timerWorkerStarted) {
      return;
    }

    timerWorkerStarted = true;

    console.log(
      "⏱️ Task timer worker started"
    );

    const runWorker = async () => {
      try {
        // First automatically resume
        // pauses whose maximum pause window
        // has expired.
        await resumeExpiredPausedTasks();

        // Then expire tasks whose active
        // working time has finished.
        await checkExpiredTasks();
      } catch (error) {
        console.error(
          "Task timer worker error:",
          error
        );
      }
    };

    // Run immediately
    void runWorker();

    // Run every second.
    //
    // Server remains the source of truth.
    //
    setInterval(() => {
      void runWorker();
    }, 1000);
  };