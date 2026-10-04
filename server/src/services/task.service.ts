import mongoose from "mongoose";

import Task from "../models/Task.js";
import Dataset from "../models/Dataset.js";
import DatasetItem from "../models/DatasetItem.js";
import Project from "../models/Project.js";
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
// CREATE TASK
// ============================================================

export const createTask = async (
  userId: string,
  userRole: string,
  input: unknown
) => {
  validateObjectId(userId, "user ID");

  const data = createTaskSchema.parse(input);

  validateObjectId(data.project, "project ID");
  validateObjectId(data.dataset, "dataset ID");
  validateObjectId(
    data.datasetItem,
    "dataset item ID"
  );

  // ==========================================================
  // FIND PROJECT
  // ==========================================================

  const project = await Project.findById(
    data.project
  );

  if (!project) {
    throw new ApiError(
      404,
      "Project not found"
    );
  }

  // ==========================================================
  // FIND DATASET
  // ==========================================================

  const dataset = await Dataset.findById(
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
  // PERMISSION CHECK
  // ==========================================================

  const isAdmin =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN";

  const isClient =
    userRole === "CLIENT" &&
    project.client.toString() === userId;

  const isProjectManager =
    userRole === "PROJECT_MANAGER" &&
    project.projectManager?.toString() ===
      userId;

  if (
    !isAdmin &&
    !isClient &&
    !isProjectManager
  ) {
    throw new ApiError(
      403,
      "You do not have permission to create tasks for this project"
    );
  }

  // ==========================================================
  // VERIFY TASK TYPE IS ALLOWED BY PROJECT
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
  // ==========================================================

  const task = await Task.create({
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

    status:
      data.status ?? "CREATED",

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

  const task = await Task.findById(
    taskId
  )
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
      client?: mongoose.Types.ObjectId;
      projectManager?:
        | mongoose.Types.ObjectId
        | null;
      status?: string;
    };

  // ==========================================================
  // CLIENT / PROJECT MANAGER ACCESS
  // ==========================================================

  if (userId && userRole) {
    const isClient =
      userRole === "CLIENT" &&
      project.client?.toString() ===
        userId;

    const isProjectManager =
      userRole === "PROJECT_MANAGER" &&
      project.projectManager?.toString() ===
        userId;

    const isClaimedContributor =
      task.claimedBy?.toString() ===
      userId;

    if (
      isClient ||
      isProjectManager ||
      isClaimedContributor
    ) {
      return task;
    }
  }

  // ==========================================================
  // REVIEWER ACCESS
  // ==========================================================

  if (userRole === "REVIEWER") {
    return task;
  }

  // ==========================================================
  // CONTRIBUTOR ACCESS
  // ==========================================================

  if (userRole === "CONTRIBUTOR") {
    if (
      task.status !== "AVAILABLE" &&
      task.status !== "CLAIMED" &&
      task.status !== "IN_PROGRESS" &&
      task.status !== "SUBMITTED" &&
      task.status !== "UNDER_REVIEW" &&
      task.status !== "REVISION" &&
      task.claimedBy?.toString() !==
        userId
    ) {
      throw new ApiError(
        403,
        "This task is not available"
      );
    }

    return task;
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

    filter.project = filters.projectId;
  }

  if (filters?.datasetId) {
    validateObjectId(
      filters.datasetId,
      "dataset ID"
    );

    filter.dataset = filters.datasetId;
  }

  if (filters?.status) {
    filter.status = filters.status;
  }

  if (filters?.type) {
    filter.type = filters.type;
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

  if (userRole === "CLIENT") {
    const projects =
      await Project.find({
        client: userId,
      }).select("_id");

    const projectIds =
      projects.map(
        (project) => project._id
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
    userRole === "PROJECT_MANAGER"
  ) {
    const projects =
      await Project.find({
        projectManager: userId,
      }).select("_id");

    const projectIds =
      projects.map(
        (project) => project._id
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

  if (userRole === "REVIEWER") {
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

  if (userRole === "CONTRIBUTOR") {
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
        "title description client projectManager status"
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

  // ==========================================================
  // PERMISSION CHECK
  // ==========================================================

  const isAdmin =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN";

  const isClient =
    userRole === "CLIENT" &&
    project.client.toString() ===
      userId;

  const isProjectManager =
    userRole === "PROJECT_MANAGER" &&
    project.projectManager?.toString() ===
      userId;

  if (
    !isAdmin &&
    !isClient &&
    !isProjectManager
  ) {
    throw new ApiError(
      403,
      "You do not have permission to update this task"
    );
  }

  // ==========================================================
  // UPDATE FIELDS
  // ==========================================================

  if (data.type !== undefined) {
    task.type = data.type;
  }

  if (data.title !== undefined) {
    task.title = data.title;
  }

  if (
    data.instructions !== undefined
  ) {
    task.instructions =
      data.instructions;
  }

  if (data.prompt !== undefined) {
    task.prompt = data.prompt;
  }

  if (
    data.evaluationCriteria !==
    undefined
  ) {
    task.evaluationCriteria =
      data.evaluationCriteria;
  }

  if (
    data.configuration !== undefined
  ) {
    task.configuration = {
      maxAttempts:
        data.configuration
          .maxAttempts ??
        task.configuration.maxAttempts,

      timeLimitMinutes:
        data.configuration
          .timeLimitMinutes ??
        task.configuration
          .timeLimitMinutes,

      reviewRequired:
        data.configuration
          .reviewRequired ??
        task.configuration
          .reviewRequired,
    };
  }

  if (data.reward !== undefined) {
    task.reward = {
      amount:
        data.reward.amount ??
        task.reward.amount,

      currency:
        data.reward.currency ??
        task.reward.currency,
    };
  }

  if (data.status !== undefined) {
    task.status = data.status;
  }

  await task.save();

  return task;
};

// ============================================================
// UPDATE TASK STATUS
// ============================================================

export const updateTaskStatus = async (
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
    await Task.findById(taskId);

  if (!task) {
    throw new ApiError(
      404,
      "Task not found"
    );
  }

  // ==========================================================
  // ADMIN / CLIENT / PROJECT MANAGER
  // ==========================================================

  if (
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN"
  ) {
    task.status = data.status;

    await task.save();

    return task;
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

  const isClient =
    userRole === "CLIENT" &&
    project.client.toString() ===
      userId;

  const isProjectManager =
    userRole === "PROJECT_MANAGER" &&
    project.projectManager?.toString() ===
      userId;

  if (
    isClient ||
    isProjectManager
  ) {
    task.status = data.status;

    await task.save();

    return task;
  }

  // ==========================================================
  // CONTRIBUTOR STATUS TRANSITIONS
  // ==========================================================

  if (userRole === "CONTRIBUTOR") {
    if (
      task.claimedBy?.toString() !==
      userId
    ) {
      throw new ApiError(
        403,
        "This task is not assigned to you"
      );
    }

    const allowedTransitions: Record<
      string,
      string[]
    > = {
      CLAIMED: [
        "IN_PROGRESS",
      ],

      IN_PROGRESS: [
        "SUBMITTED",
        "REVISION",
      ],
    };

    const allowed =
      allowedTransitions[
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

    task.status = data.status;

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
    await Task.findById(taskId);

  if (!task) {
    throw new ApiError(
      404,
      "Task not found"
    );
  }

  if (
    task.status !== "AVAILABLE"
  ) {
    throw new ApiError(
      400,
      "This task is not available for claiming"
    );
  }

  if (task.claimedBy) {
    throw new ApiError(
      409,
      "This task has already been claimed"
    );
  }

  task.claimedBy =
    new mongoose.Types.ObjectId(
      contributorId
    );

  task.claimedAt =
    new Date();

  task.status = "CLAIMED";

  await task.save();

  return task;
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
    await Task.findById(taskId);

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
    task.status !== "CLAIMED" &&
    task.status !== "REVISION"
  ) {
    throw new ApiError(
      400,
      "This task cannot be started"
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

  const isAdmin =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN";

  const isClient =
    userRole === "CLIENT" &&
    project.client.toString() ===
      userId;

  const isProjectManager =
    userRole === "PROJECT_MANAGER" &&
    project.projectManager?.toString() ===
      userId;

  if (
    !isAdmin &&
    !isClient &&
    !isProjectManager
  ) {
    throw new ApiError(
      403,
      "You do not have permission to publish this task"
    );
  }

  if (
    task.status !== "CREATED"
  ) {
    throw new ApiError(
      400,
      "Only created tasks can be published"
    );
  }

  task.status =
    "AVAILABLE";

  await task.save();

  return task;
};