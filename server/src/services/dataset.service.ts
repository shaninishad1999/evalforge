import mongoose from "mongoose";

import Dataset from "../models/Dataset.js";
import Project from "../models/Project.js";
import ApiError from "../utils/ApiError.js";

import {
  createDatasetSchema,
  updateDatasetSchema,
} from "../validations/dataset.validation.js";

// ============================================================
// OBJECT ID VALIDATION
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
// CREATE DATASET
// ============================================================

export const createDataset = async (
  userId: string,
  userRole: string,
  input: unknown
) => {
  validateObjectId(userId, "user ID");

  const data = createDatasetSchema.parse(input);

  validateObjectId(data.project, "project ID");

  const project = await Project.findById(data.project);

  if (!project) {
    throw new ApiError(
      404,
      "Project not found"
    );
  }

  // ==========================================================
  // ACCESS CONTROL
  // ==========================================================

  const isAdmin =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN";

  const isClient =
    userRole === "CLIENT" &&
    project.client.toString() === userId;

  const isProjectManager =
    userRole === "PROJECT_MANAGER" &&
    project.projectManager?.toString() === userId;

  if (
    !isAdmin &&
    !isClient &&
    !isProjectManager
  ) {
    throw new ApiError(
      403,
      "You do not have permission to create a dataset for this project"
    );
  }

  // ==========================================================
  // CREATE DATASET
  // ==========================================================

  const dataset = await Dataset.create({
    name: data.name,
    description: data.description,

    project: data.project,

    createdBy: userId,

    type: data.type,

    source: {
      name: data.source?.name ?? "",
      description:
        data.source?.description ?? "",
    },

    configuration: {
      taskTypes:
        data.configuration?.taskTypes ?? [],

      totalItems:
        data.configuration?.totalItems ?? 0,
    },

    status: "DRAFT",

    publishedAt: null,
    completedAt: null,
  });

  return dataset;
};

// ============================================================
// GET DATASET BY ID
// ============================================================

export const getDatasetById = async (
  datasetId: string,
  userId?: string,
  userRole?: string
) => {
  validateObjectId(
    datasetId,
    "dataset ID"
  );

  const dataset = await Dataset.findById(
    datasetId
  )
    .populate(
      "project",
      "title description client projectManager status"
    )
    .populate(
      "createdBy",
      "name email role"
    );

  if (!dataset) {
    throw new ApiError(
      404,
      "Dataset not found"
    );
  }

  // ==========================================================
  // ADMIN ACCESS
  // ==========================================================

  if (
    userRole &&
    (
      userRole === "SUPER_ADMIN" ||
      userRole === "ADMIN"
    )
  ) {
    return dataset;
  }

  // ==========================================================
  // PROJECT ACCESS
  // ==========================================================

  const project = dataset.project as unknown as {
    client?: mongoose.Types.ObjectId;
    projectManager?: mongoose.Types.ObjectId | null;
    status?: string;
  };

  if (userId && userRole) {
    const isClient =
      userRole === "CLIENT" &&
      project.client?.toString() === userId;

    const isProjectManager =
      userRole === "PROJECT_MANAGER" &&
      project.projectManager?.toString() === userId;

    const isCreator =
      dataset.createdBy.toString() === userId;

    if (
      isClient ||
      isProjectManager ||
      isCreator
    ) {
      return dataset;
    }
  }

  // ==========================================================
  // PUBLIC / CONTRIBUTOR ACCESS
  // ==========================================================

  if (
    project.status !== "PUBLISHED" &&
    project.status !== "ACTIVE"
  ) {
    throw new ApiError(
      403,
      "You do not have access to this dataset"
    );
  }

  if (
    dataset.status !== "PUBLISHED" &&
    dataset.status !== "READY"
  ) {
    throw new ApiError(
      403,
      "This dataset is not available"
    );
  }

  return dataset;
};

// ============================================================
// GET DATASETS
// ============================================================

export const getDatasets = async (
  userId: string,
  userRole: string
) => {
  validateObjectId(
    userId,
    "user ID"
  );

  // ==========================================================
  // ADMIN
  // ==========================================================

  if (
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN"
  ) {
    return Dataset.find()
      .populate(
        "project",
        "title client projectManager status"
      )
      .populate(
        "createdBy",
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
    const projects = await Project.find({
      client: userId,
    }).select("_id");

    const projectIds = projects.map(
      (project) => project._id
    );

    return Dataset.find({
      project: {
        $in: projectIds,
      },
    })
      .populate(
        "project",
        "title client projectManager status"
      )
      .populate(
        "createdBy",
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

    const projectIds = projects.map(
      (project) => project._id
    );

    return Dataset.find({
      project: {
        $in: projectIds,
      },
    })
      .populate(
        "project",
        "title client projectManager status"
      )
      .populate(
        "createdBy",
        "name email role"
      )
      .sort({
        createdAt: -1,
      });
  }

  // ==========================================================
  // CONTRIBUTOR / REVIEWER
  // ==========================================================

  return Dataset.find({
    status: {
      $in: [
        "READY",
        "PUBLISHED",
      ],
    },
  })
    .populate(
      "project",
      "title description client projectManager status"
    )
    .populate(
      "createdBy",
      "name email role"
    )
    .sort({
      createdAt: -1,
    });
};

// ============================================================
// UPDATE DATASET
// ============================================================

export const updateDataset = async (
  datasetId: string,
  userId: string,
  userRole: string,
  input: unknown
) => {
  validateObjectId(
    datasetId,
    "dataset ID"
  );

  validateObjectId(
    userId,
    "user ID"
  );

  const data =
    updateDatasetSchema.parse(input);

  const dataset =
    await Dataset.findById(datasetId);

  if (!dataset) {
    throw new ApiError(
      404,
      "Dataset not found"
    );
  }

  const project =
    await Project.findById(
      dataset.project
    );

  if (!project) {
    throw new ApiError(
      404,
      "Project not found"
    );
  }

  // ==========================================================
  // ACCESS CONTROL
  // ==========================================================

  const isAdmin =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN";

  const isClient =
    userRole === "CLIENT" &&
    project.client.toString() === userId;

  const isProjectManager =
    userRole === "PROJECT_MANAGER" &&
    project.projectManager?.toString() === userId;

  if (
    !isAdmin &&
    !isClient &&
    !isProjectManager
  ) {
    throw new ApiError(
      403,
      "You do not have permission to update this dataset"
    );
  }

  // ==========================================================
  // UPDATE
  // ==========================================================

  if (data.name !== undefined) {
    dataset.name = data.name;
  }

  if (
    data.description !== undefined
  ) {
    dataset.description =
      data.description;
  }

  if (data.type !== undefined) {
    dataset.type = data.type;
  }

  if (data.source !== undefined) {
    dataset.source = {
      name:
        data.source.name ??
        dataset.source.name,

      description:
        data.source.description ??
        dataset.source.description,
    };
  }

  if (
    data.configuration !== undefined
  ) {
    dataset.configuration = {
      taskTypes:
        data.configuration.taskTypes ??
        dataset.configuration.taskTypes,

      totalItems:
        data.configuration.totalItems ??
        dataset.configuration.totalItems,
    };
  }

  if (data.status !== undefined) {
    dataset.status = data.status;

    if (
      data.status === "PUBLISHED"
    ) {
      dataset.publishedAt =
        dataset.publishedAt ??
        new Date();
    }

    if (
      data.status === "COMPLETED"
    ) {
      dataset.completedAt =
        dataset.completedAt ??
        new Date();
    }
  }

  await dataset.save();

  return dataset;
};

// ============================================================
// DELETE DATASET
// ============================================================

export const deleteDataset = async (
  datasetId: string,
  userId: string,
  userRole: string
) => {
  validateObjectId(
    datasetId,
    "dataset ID"
  );

  validateObjectId(
    userId,
    "user ID"
  );

  const dataset =
    await Dataset.findById(datasetId);

  if (!dataset) {
    throw new ApiError(
      404,
      "Dataset not found"
    );
  }

  const project =
    await Project.findById(
      dataset.project
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
    project.client.toString() === userId;

  const isProjectManager =
    userRole === "PROJECT_MANAGER" &&
    project.projectManager?.toString() === userId;

  if (
    !isAdmin &&
    !isClient &&
    !isProjectManager
  ) {
    throw new ApiError(
      403,
      "You do not have permission to delete this dataset"
    );
  }

  await Dataset.findByIdAndDelete(
    datasetId
  );

  return {
    deleted: true,
    datasetId,
  };
};