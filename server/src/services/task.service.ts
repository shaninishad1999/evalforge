import mongoose from "mongoose";

import Task from "../models/Task.js";

import Dataset from "../models/Dataset.js";

import DatasetItem from "../models/DatasetItem.js";

import Project from "../models/Project.js";

import ProjectAssignment from "../models/ProjectAssignment.js";

import ApiError from "../utils/ApiError.js";

import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from "../validations/task.validation.js";

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
// CHECK PROJECT MANAGEMENT ACCESS
// ============================================================

const canManageProject = (
  project: {
    client: mongoose.Types.ObjectId;
    projectManager:
      | mongoose.Types.ObjectId
      | null;
  },
  userId: string,
  userRole: string
) => {
  if (
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN"
  ) {
    return true;
  }

  if (
    userRole === "CLIENT" &&
    project.client.toString() === userId
  ) {
    return true;
  }

  if (
    userRole === "PROJECT_MANAGER" &&
    project.projectManager?.toString() === userId
  ) {
    return true;
  }

  return false;
};

// ============================================================
// CHECK CONTRIBUTOR PROJECT ASSIGNMENT
// ============================================================

const getContributorAssignment = async (
  projectId: mongoose.Types.ObjectId,
  contributorId: string
) => {
  return ProjectAssignment.findOne({
    project: projectId,
    contributor: contributorId,
    status: {
      $in: [
        "PENDING",
        "ACTIVE",
        "PAUSED",
      ],
    },
  });
};

// ============================================================
// CREATE TASK
// ============================================================

export const createTask = async (
  userId: string,
  userRole: string,
  input: unknown
) => {
  validateObjectId(
    userId,
    "user ID"
  );

  const data =
    createTaskSchema.parse(input);

  validateObjectId(
    data.project,
    "project ID"
  );

  validateObjectId(
    data.dataset,
    "dataset ID"
  );

  validateObjectId(
    data.datasetItem,
    "dataset item ID"
  );

  // ==========================================================
  // FIND PROJECT
  // ==========================================================

  const project =
    await Project.findById(
      data.project
    );

  if (!project) {
    throw new ApiError(
      404,
      "Project not found"
    );
  }

  // ==========================================================
  // PERMISSION CHECK
  // ==========================================================

  if (
    !canManageProject(
      project,
      userId,
      userRole
    )
  ) {
    throw new ApiError(
      403,
      "You do not have permission to create tasks for this project"
    );
  }

  // ==========================================================
  // FIND DATASET
  // ==========================================================

  const dataset =
    await Dataset.findById(
      data.dataset
    );

  if (!dataset) {
    throw new ApiError(
      404,
      "Dataset not found"
    );
  }

  // ==========================================================
  // VERIFY DATASET BELONGS TO PROJECT
  // ==========================================================

  if (
    dataset.project.toString() !==
    project._id.toString()
  ) {
    throw new ApiError(
      400,
      "Dataset does not belong to this project"
    );
  }

  // ==========================================================
  // FIND DATASET ITEM
  // ==========================================================

  const datasetItem =
    await DatasetItem.findById(
      data.datasetItem
    );

  if (!datasetItem) {
    throw new ApiError(
      404,
      "Dataset item not found"
    );
  }

  // ==========================================================
  // VERIFY DATASET ITEM BELONGS TO DATASET
  // ==========================================================

  if (
    datasetItem.dataset.toString() !==
    dataset._id.toString()
  ) {
    throw new ApiError(
      400,
      "Dataset item does not belong to this dataset"
    );
  }

  // ==========================================================
  // VERIFY DATASET ITEM BELONGS TO PROJECT
  // ==========================================================

  if (
    datasetItem.project.toString() !==
    project._id.toString()
  ) {
    throw new ApiError(
      400,
      "Dataset item does not belong to this project"
    );
  }

  // ==========================================================
  // VERIFY TASK TYPE
  // ==========================================================

  if (
    !project.taskConfiguration.taskTypes.includes(
      data.type
    )
  ) {
    throw new ApiError(
      400,
      "This task type is not configured for the project"
    );
  }

  // ==========================================================
  // VERIFY DATASET ITEM TYPE
  // ==========================================================

  const typeMatches =
    (datasetItem.type === "TEXT" &&
      data.type.startsWith("TEXT_")) ||
    (datasetItem.type === "IMAGE" &&
      data.type.startsWith("IMAGE_")) ||
    (datasetItem.type === "AUDIO" &&
      data.type.startsWith("AUDIO_")) ||
    (datasetItem.type === "VIDEO" &&
      data.type.startsWith("VIDEO_")) ||
    (datasetItem.type === "CODE" &&
      data.type.startsWith("CODE_"));

  if (!typeMatches) {
    throw new ApiError(
      400,
      "Task type does not match dataset item type"
    );
  }

  // ==========================================================
  // CREATE TASK
  //
  // New tasks ALWAYS start as CREATED.
  // A client cannot create an already-approved/claimed task.
  // ==========================================================

  const task =
    await Task.create({
      project: data.project,

      dataset: data.dataset,

      datasetItem: data.datasetItem,

      type: data.type,

      title: data.title,

      instructions: data.instructions,

      prompt: data.prompt ?? "",

      evaluationCriteria:
        data.evaluationCriteria ?? [],

      configuration: {
        maxAttempts:
          data.configuration?.maxAttempts ??
          3,

        timeLimitMinutes:
          data.configuration
            ?.timeLimitMinutes ?? null,

        reviewRequired:
          data.configuration
            ?.reviewRequired ?? true,
      },

      reward: {
        amount: data.reward.amount,

        currency:
          data.reward.currency ??
          project.rewardConfiguration
            .currency ??
          "INR",
      },

      status: "CREATED",

      claimedBy: null,

      claimedAt: null,

      startedAt: null,

      submittedAt: null,

      reviewedAt: null,
    });

  return task;
};

// ============================================================
// GET TASK BY ID
// ============================================================

export const getTaskById = async (
  taskId: string,
  userId?: string,
  userRole?: string
) => {
  validateObjectId(
    taskId,
    "task ID"
  );

  const task =
    await Task.findById(taskId)
      .populate(
        "project",
        "title description client projectManager status"
      )
      .populate(
        "dataset",
        "name description type status project"
      )
      .populate(
        "datasetItem",
        "type content metadata status"
      )
      .populate(
        "claimedBy",
        "name email role"
      );

  if (!task) {
    throw new ApiError(
      404,
      "Task not found"
    );
  }

  // ==========================================================
  // ADMIN ACCESS
  // ==========================================================

  if (
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN"
  ) {
    return task;
  }

  // ==========================================================
  // PROJECT INFORMATION
  // ==========================================================

  const project =
    task.project as unknown as {
      _id: mongoose.Types.ObjectId;
      client?: mongoose.Types.ObjectId;
      projectManager?:
        | mongoose.Types.ObjectId
        | null;
      status?: string;
    };

  // ==========================================================
  // CLIENT / PROJECT MANAGER ACCESS
  // ==========================================================

  if (
    userId &&
    userRole
  ) {
    const isClient =
      userRole === "CLIENT" &&
      project.client?.toString() ===
        userId;

    const isProjectManager =
      userRole === "PROJECT_MANAGER" &&
      project.projectManager?.toString() ===
        userId;

    if (
      isClient ||
      isProjectManager
    ) {
      return task;
    }
  }

  // ==========================================================
  // REVIEWER ACCESS
  // ==========================================================

  if (
    userRole === "REVIEWER"
  ) {
    return task;
  }

  // ==========================================================
  // CONTRIBUTOR ACCESS
  // ==========================================================

  if (
    userRole === "CONTRIBUTOR"
  ) {
    if (!userId) {
      throw new ApiError(
        401,
        "Authentication required"
      );
    }

    const assignment =
      await getContributorAssignment(
        project._id,
        userId
      );

    const isClaimedByContributor =
      task.claimedBy?.toString() ===
      userId;

    // A contributor can access a claimed task
    // even if the assignment later becomes paused,
    // because they already own the task.
    if (
      !assignment &&
      !isClaimedByContributor
    ) {
      throw new ApiError(
        403,
        "You are not assigned to this project"
      );
    }

    // AVAILABLE tasks require an active assignment.
    if (
      task.status === "AVAILABLE" &&
      assignment
    ) {
      return task;
    }

    // All non-available working states require
    // the task to actually belong to this contributor.
    if (
      isClaimedByContributor
    ) {
      return task;
    }

    throw new ApiError(
      403,
      "This task is not available"
    );
  }

  throw new ApiError(
    403,
    "You do not have access to this task"
  );
};

// ============================================================
// GET TASKS
// ============================================================

export const getTasks = async (
  userId: string,
  userRole: string,
  filters?: {
    projectId?: string;
    datasetId?: string;
    status?: string;
    type?: string;
  }
) => {
  validateObjectId(
    userId,
    "user ID"
  );

  // ==========================================================
  // BUILD FILTER
  // ==========================================================

  const filter: Record<
    string,
    unknown
  > = {};

  if (filters?.projectId) {
    validateObjectId(
      filters.projectId,
      "project ID"
    );

    filter.project =
      filters.projectId;
  }

  if (filters?.datasetId) {
    validateObjectId(
      filters.datasetId,
      "dataset ID"
    );

    filter.dataset =
      filters.datasetId;
  }

  if (filters?.status) {
    filter.status =
      filters.status;
  }

  if (filters?.type) {
    filter.type =
      filters.type;
  }

  // ==========================================================
  // ADMIN
  // ==========================================================

  if (
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN"
  ) {
    return Task.find(filter)
      .populate(
        "project",
        "title client projectManager status"
      )
      .populate(
        "dataset",
        "name type status"
      )
      .populate(
        "datasetItem",
        "type content metadata status"
      )
      .populate(
        "claimedBy",
        "name email role"
      )
      .sort({
        createdAt: -1,
      });
  }

  // ==========================================================
  // CLIENT
  // ==========================================================

  if (
    userRole === "CLIENT"
  ) {
    const projects =
      await Project.find({
        client: userId,
      }).select("_id");

    const projectIds =
      projects.map(
        (project) =>
          project._id
      );

    filter.project = {
      $in: projectIds,
    };

    return Task.find(filter)
      .populate(
        "project",
        "title client projectManager status"
      )
      .populate(
        "dataset",
        "name type status"
      )
      .populate(
        "datasetItem",
        "type content metadata status"
      )
      .populate(
        "claimedBy",
        "name email role"
      )
      .sort({
        createdAt: -1,
      });
  }

  // ==========================================================
  // PROJECT MANAGER
  // ==========================================================

  if (
    userRole ===
    "PROJECT_MANAGER"
  ) {
    const projects =
      await Project.find({
        projectManager: userId,
      }).select("_id");

    const projectIds =
      projects.map(
        (project) =>
          project._id
      );

    filter.project = {
      $in: projectIds,
    };

    return Task.find(filter)
      .populate(
        "project",
        "title client projectManager status"
      )
      .populate(
        "dataset",
        "name type status"
      )
      .populate(
        "datasetItem",
        "type content metadata status"
      )
      .populate(
        "claimedBy",
        "name email role"
      )
      .sort({
        createdAt: -1,
      });
  }

  // ==========================================================
  // REVIEWER
  // ==========================================================

  if (
    userRole === "REVIEWER"
  ) {
    return Task.find(filter)
      .populate(
        "project",
        "title client projectManager status"
      )
      .populate(
        "dataset",
        "name type status"
      )
      .populate(
        "datasetItem",
        "type content metadata status"
      )
      .populate(
        "claimedBy",
        "name email role"
      )
      .sort({
        createdAt: -1,
      });
  }

  // ==========================================================
  // CONTRIBUTOR
  // ==========================================================

  if (
    userRole === "CONTRIBUTOR"
  ) {
    const assignments =
      await ProjectAssignment.find({
        contributor: userId,
        status: {
          $in: [
            "PENDING",
            "ACTIVE",
            "PAUSED",
          ],
        },
      }).select("project");

    const projectIds =
      assignments.map(
        (assignment) =>
          assignment.project
      );

    if (
      projectIds.length === 0
    ) {
      return [];
    }

    filter.project = {
      $in: projectIds,
    };

    // Contributor can see available tasks
    // from assigned projects and their own
    // already-claimed tasks.
    filter.$or = [
      {
        status: "AVAILABLE",
      },
      {
        claimedBy: userId,
      },
    ];

    return Task.find(filter)
      .populate(
        "project",
        "title client projectManager status"
      )
      .populate(
        "dataset",
        "name type status"
      )
      .populate(
        "datasetItem",
        "type content metadata status"
      )
      .populate(
        "claimedBy",
        "name email role"
      )
      .sort({
        createdAt: -1,
      });
  }

  return [];
};

// ============================================================
// UPDATE TASK
// ============================================================

export const updateTask = async (
  taskId: string,
  userId: string,
  userRole: string,
  input: unknown
) => {
  validateObjectId(
    taskId,
    "task ID"
  );

  validateObjectId(
    userId,
    "user ID"
  );

  const data =
    updateTaskSchema.parse(input);

  const task =
    await Task.findById(taskId);

  if (!task) {
    throw new ApiError(
      404,
      "Task not found"
    );
  }

  const project =
    await Project.findById(
      task.project
    );

  if (!project) {
    throw new ApiError(
      404,
      "Project not found"
    );
  }

  if (
    !canManageProject(
      project,
      userId,
      userRole
    )
  ) {
    throw new ApiError(
      403,
      "You do not have permission to update this task"
    );
  }

  // ==========================================================
  // PREVENT EDITING COMPLETED TASKS
  // ==========================================================

  if (
    [
      "APPROVED",
      "REJECTED",
    ].includes(task.status)
  ) {
    throw new ApiError(
      400,
      "Completed tasks cannot be edited"
    );
  }

  // ==========================================================
  // UPDATE FIELDS
  // ==========================================================

  if (
    data.type !== undefined
  ) {
    if (
      !project.taskConfiguration.taskTypes.includes(
        data.type
      )
    ) {
      throw new ApiError(
        400,
        "This task type is not configured for the project"
      );
    }

    task.type =
      data.type;
  }

  if (
    data.title !== undefined
  ) {
    task.title =
      data.title;
  }

  if (
    data.instructions !== undefined
  ) {
    task.instructions =
      data.instructions;
  }

  if (
    data.prompt !== undefined
  ) {
    task.prompt =
      data.prompt;
  }

  if (
    data.evaluationCriteria !==
    undefined
  ) {
    task.evaluationCriteria =
      data.evaluationCriteria;
  }

  if (
    data.configuration !==
    undefined
  ) {
    task.configuration = {
      ...task.configuration,
      ...data.configuration,
    };
  }

  if (
    data.reward !== undefined
  ) {
    task.reward = {
      ...task.reward,
      ...data.reward,
    };
  }

  // IMPORTANT:
  // Status is intentionally NOT updated here.
  // Use updateTaskStatus(), claimTask(), startTask()
  // and the submission/review lifecycle instead.

  await task.save();

  return task;
};

// ============================================================
// UPDATE TASK STATUS
// ============================================================

export const updateTaskStatus =
  async (
    taskId: string,
    userId: string,
    userRole: string,
    input: unknown
  ) => {
    validateObjectId(
      taskId,
      "task ID"
    );

    validateObjectId(
      userId,
      "user ID"
    );

    const data =
      updateTaskStatusSchema.parse(
        input
      );

    const task =
      await Task.findById(
        taskId
      );

    if (!task) {
      throw new ApiError(
        404,
        "Task not found"
      );
    }

    const project =
      await Project.findById(
        task.project
      );

    if (!project) {
      throw new ApiError(
        404,
        "Project not found"
      );
    }

    // ========================================================
    // ADMIN
    // ========================================================

    if (
      userRole === "SUPER_ADMIN" ||
      userRole === "ADMIN"
    ) {
      throw new ApiError(
        400,
        "Use the dedicated task lifecycle endpoints instead of manually changing task status"
      );
    }

    // ========================================================
    // CLIENT / PROJECT MANAGER
    // ========================================================

    if (
      userRole === "CLIENT" ||
      userRole === "PROJECT_MANAGER"
    ) {
      if (
        !canManageProject(
          project,
          userId,
          userRole
        )
      ) {
        throw new ApiError(
          403,
          "You do not have permission to update this task"
        );
      }

      const managementTransitions:
        Record<string, string[]> = {
          CREATED: [
            "AVAILABLE",
          ],

          AVAILABLE: [
            "CREATED",
          ],

          SUBMITTED: [
            "UNDER_REVIEW",
          ],
        };

      const allowed =
        managementTransitions[
          task.status
        ] ?? [];

      if (
        !allowed.includes(
          data.status
        )
      ) {
        throw new ApiError(
          400,
          `Cannot change task status from ${task.status} to ${data.status}`
        );
      }

      task.status =
        data.status;

      await task.save();

      return task;
    }

    // ========================================================
    // CONTRIBUTOR
    // ========================================================

    if (
      userRole === "CONTRIBUTOR"
    ) {
      if (
        task.claimedBy?.toString() !==
        userId
      ) {
        throw new ApiError(
          403,
          "This task is not assigned to you"
        );
      }

      const contributorTransitions:
        Record<string, string[]> = {
          CLAIMED: [
            "IN_PROGRESS",
          ],

          IN_PROGRESS: [
            "SUBMITTED",
          ],

          REVISION: [
            "IN_PROGRESS",
          ],
        };

      const allowed =
        contributorTransitions[
          task.status
        ] ?? [];

      if (
        !allowed.includes(
          data.status
        )
      ) {
        throw new ApiError(
          400,
          `Cannot change task status from ${task.status} to ${data.status}`
        );
      }

      task.status =
        data.status;

      if (
        data.status ===
        "IN_PROGRESS"
      ) {
        task.startedAt =
          task.startedAt ??
          new Date();
      }

      if (
        data.status ===
        "SUBMITTED"
      ) {
        task.submittedAt =
          new Date();
      }

      await task.save();

      return task;
    }

    throw new ApiError(
      403,
      "You do not have permission to update this task status"
    );
  };

// ============================================================
// CLAIM TASK
// ============================================================

export const claimTask = async (
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

  const task =
    await Task.findById(
      taskId
    );

  if (!task) {
    throw new ApiError(
      404,
      "Task not found"
    );
  }

  // ==========================================================
  // VERIFY TASK AVAILABILITY
  // ==========================================================

  if (
    task.status !==
    "AVAILABLE"
  ) {
    throw new ApiError(
      400,
      "This task is not available for claiming"
    );
  }

  // ==========================================================
  // VERIFY PROJECT ASSIGNMENT
  // ==========================================================

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

  // ==========================================================
  // ATOMIC CLAIM
  //
  // status + claimedBy are checked by MongoDB itself.
  // Therefore two simultaneous requests cannot both
  // successfully claim the same task.
  // ==========================================================

  const claimedTask =
    await Task.findOneAndUpdate(
      {
        _id: taskId,
        status: "AVAILABLE",
        claimedBy: null,
      },
      {
        $set: {
          claimedBy:
            new mongoose.Types.ObjectId(
              contributorId
            ),

          claimedAt:
            new Date(),

          status:
            "CLAIMED",
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

  if (!claimedTask) {
    throw new ApiError(
      409,
      "This task has already been claimed"
    );
  }

  return claimedTask;
};

// ============================================================
// START TASK
// ============================================================

export const startTask = async (
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

  const task =
    await Task.findById(
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
    task.status !==
      "CLAIMED" &&
    task.status !==
      "REVISION"
  ) {
    throw new ApiError(
      400,
      "Task cannot be started in its current status"
    );
  }

  task.status =
    "IN_PROGRESS";

  task.startedAt =
    task.startedAt ??
    new Date();

  await task.save();

  return task;
};

// ============================================================
// PUBLISH TASK
// ============================================================

export const publishTask = async (
  taskId: string,
  userId: string,
  userRole: string
) => {
  validateObjectId(
    taskId,
    "task ID"
  );

  validateObjectId(
    userId,
    "user ID"
  );

  const task =
    await Task.findById(
      taskId
    );

  if (!task) {
    throw new ApiError(
      404,
      "Task not found"
    );
  }

  const project =
    await Project.findById(
      task.project
    );

  if (!project) {
    throw new ApiError(
      404,
      "Project not found"
    );
  }

  if (
    !canManageProject(
      project,
      userId,
      userRole
    )
  ) {
    throw new ApiError(
      403,
      "You do not have permission to publish this task"
    );
  }

  if (
    task.status !==
    "CREATED"
  ) {
    throw new ApiError(
      400,
      "Only CREATED tasks can be published"
    );
  }

  if (
    project.status !==
      "PUBLISHED" &&
    project.status !==
      "ACTIVE"
  ) {
    throw new ApiError(
      400,
      "Project must be published or active before its tasks can be published"
    );
  }

  task.status =
    "AVAILABLE";

  await task.save();

  return task;
};