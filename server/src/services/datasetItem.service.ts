import mongoose from "mongoose";

import DatasetItem from "../models/DatasetItem.js";
import Dataset from "../models/Dataset.js";
import Project from "../models/Project.js";
import ApiError from "../utils/ApiError.js";

import {
  createDatasetItemSchema,
  updateDatasetItemSchema,
} from "../validations/datasetItem.validation.js";

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
// CREATE DATASET ITEM
// ============================================================

export const createDatasetItem = async (
  userId: string,
  userRole: string,
  input: unknown
) => {
  validateObjectId(userId, "user ID");

  const data =
    createDatasetItemSchema.parse(input);

  validateObjectId(
    data.dataset,
    "dataset ID"
  );

  validateObjectId(
    data.project,
    "project ID"
  );

  // ==========================================================
  // FIND DATASET
  // ==========================================================

  const dataset =
    await Dataset.findById(data.dataset);

  if (!dataset) {
    throw new ApiError(
      404,
      "Dataset not found"
    );
  }

  // ==========================================================
  // FIND PROJECT
  // ==========================================================

  const project =
    await Project.findById(data.project);

  if (!project) {
    throw new ApiError(
      404,
      "Project not found"
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
      "You do not have permission to create dataset items for this project"
    );
  }

  // ==========================================================
  // CREATE DATASET ITEM
  // ==========================================================

  const datasetItem =
    await DatasetItem.create({
      dataset: data.dataset,
      project: data.project,
      externalId:
        data.externalId ?? null,

      type: data.type,

      content: {
        text:
          data.content?.text ?? "",

        imageUrl:
          data.content?.imageUrl ?? "",

        audioUrl:
          data.content?.audioUrl ?? "",

        videoUrl:
          data.content?.videoUrl ?? "",

        code:
          data.content?.code ?? "",
      },

      metadata:
        data.metadata ?? {},

      status:
        data.status ?? "PENDING",

      createdBy: userId,
    });

  // ==========================================================
  // UPDATE DATASET ITEM COUNT
  // ==========================================================

  await Dataset.findByIdAndUpdate(
    data.dataset,
    {
      $inc: {
        "configuration.totalItems": 1,
      },
    }
  );

  return datasetItem;
};

// ============================================================
// GET DATASET ITEM BY ID
// ============================================================

export const getDatasetItemById = async (
  datasetItemId: string,
  userId?: string,
  userRole?: string
) => {
  validateObjectId(
    datasetItemId,
    "dataset item ID"
  );

  const datasetItem =
    await DatasetItem.findById(
      datasetItemId
    )
      .populate(
        "dataset",
        "name description project type status"
      )
      .populate(
        "project",
        "title description client projectManager status"
      )
      .populate(
        "createdBy",
        "name email role"
      );

  if (!datasetItem) {
    throw new ApiError(
      404,
      "Dataset item not found"
    );
  }

  // ==========================================================
  // ADMIN ACCESS
  // ==========================================================

  if (
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN"
  ) {
    return datasetItem;
  }

  // ==========================================================
  // PROJECT INFORMATION
  // ==========================================================

  const project =
    datasetItem.project as unknown as {
      client?: mongoose.Types.ObjectId;
      projectManager?:
        | mongoose.Types.ObjectId
        | null;
      status?: string;
    };

  // ==========================================================
  // OWNER / PROJECT MANAGER ACCESS
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

    const isCreator =
      datasetItem.createdBy.toString() ===
      userId;

    if (
      isClient ||
      isProjectManager ||
      isCreator
    ) {
      return datasetItem;
    }
  }

  // ==========================================================
  // PUBLIC CONTRIBUTOR ACCESS
  // ==========================================================

  if (
    project.status !== "PUBLISHED" &&
    project.status !== "ACTIVE"
  ) {
    throw new ApiError(
      403,
      "You do not have access to this dataset item"
    );
  }

  if (
    datasetItem.status !== "READY" &&
    datasetItem.status !== "PUBLISHED"
  ) {
    throw new ApiError(
      403,
      "This dataset item is not available"
    );
  }

  return datasetItem;
};

// ============================================================
// GET DATASET ITEMS
// ============================================================

export const getDatasetItems = async (
  userId: string,
  userRole: string,
  datasetId?: string
) => {
  validateObjectId(userId, "user ID");

  if (datasetId) {
    validateObjectId(
      datasetId,
      "dataset ID"
    );
  }

  // ==========================================================
  // ADMIN
  // ==========================================================

  if (
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN"
  ) {
    const filter: {
      dataset?: string;
    } = {};

    if (datasetId) {
      filter.dataset = datasetId;
    }

    return DatasetItem.find(filter)
      .populate(
        "dataset",
        "name description project type status"
      )
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
    const projects =
      await Project.find({
        client: userId,
      }).select("_id");

    const projectIds =
      projects.map(
        (project) => project._id
      );

    const filter: {
      project: {
        $in: mongoose.Types.ObjectId[];
      };
      dataset?: string;
    } = {
      project: {
        $in: projectIds,
      },
    };

    if (datasetId) {
      filter.dataset = datasetId;
    }

    return DatasetItem.find(filter)
      .populate(
        "dataset",
        "name description project type status"
      )
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

    const projectIds =
      projects.map(
        (project) => project._id
      );

    const filter: {
      project: {
        $in: mongoose.Types.ObjectId[];
      };
      dataset?: string;
    } = {
      project: {
        $in: projectIds,
      },
    };

    if (datasetId) {
      filter.dataset = datasetId;
    }

    return DatasetItem.find(filter)
      .populate(
        "dataset",
        "name description project type status"
      )
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

  const filter: {
    status: {
      $in: (
        | "READY"
        | "PUBLISHED"
      )[];
    };
    dataset?: string;
  } = {
    status: {
      $in: [
        "READY",
        "PUBLISHED",
      ],
    },
  };

  if (datasetId) {
    filter.dataset = datasetId;
  }

  return DatasetItem.find(filter)
    .populate(
      "dataset",
      "name description project type status"
    )
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
// UPDATE DATASET ITEM
// ============================================================

export const updateDatasetItem = async (
  datasetItemId: string,
  userId: string,
  userRole: string,
  input: unknown
) => {
  validateObjectId(
    datasetItemId,
    "dataset item ID"
  );

  validateObjectId(
    userId,
    "user ID"
  );

  const data =
    updateDatasetItemSchema.parse(input);

  const datasetItem =
    await DatasetItem.findById(
      datasetItemId
    );

  if (!datasetItem) {
    throw new ApiError(
      404,
      "Dataset item not found"
    );
  }

  // ==========================================================
  // FIND PROJECT
  // ==========================================================

  const project =
    await Project.findById(
      datasetItem.project
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
      "You do not have permission to update this dataset item"
    );
  }

  // ==========================================================
  // UPDATE FIELDS
  // ==========================================================

  if (
    data.externalId !== undefined
  ) {
    datasetItem.externalId =
      data.externalId;
  }

  if (data.type !== undefined) {
    datasetItem.type = data.type;
  }

  if (data.content !== undefined) {
    datasetItem.content = {
      text:
        data.content.text ??
        datasetItem.content.text,

      imageUrl:
        data.content.imageUrl ??
        datasetItem.content.imageUrl,

      audioUrl:
        data.content.audioUrl ??
        datasetItem.content.audioUrl,

      videoUrl:
        data.content.videoUrl ??
        datasetItem.content.videoUrl,

      code:
        data.content.code ??
        datasetItem.content.code,
    };
  }

  if (data.metadata !== undefined) {
    datasetItem.metadata =
      data.metadata;
  }

  if (data.status !== undefined) {
    datasetItem.status =
      data.status;
  }

  await datasetItem.save();

  return datasetItem;
};

// ============================================================
// DELETE DATASET ITEM
// ============================================================

export const deleteDatasetItem = async (
  datasetItemId: string,
  userId: string,
  userRole: string
) => {
  validateObjectId(
    datasetItemId,
    "dataset item ID"
  );

  validateObjectId(
    userId,
    "user ID"
  );

  const datasetItem =
    await DatasetItem.findById(
      datasetItemId
    );

  if (!datasetItem) {
    throw new ApiError(
      404,
      "Dataset item not found"
    );
  }

  // ==========================================================
  // FIND PROJECT
  // ==========================================================

  const project =
    await Project.findById(
      datasetItem.project
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
      "You do not have permission to delete this dataset item"
    );
  }

  // ==========================================================
  // DELETE ITEM
  // ==========================================================

  await DatasetItem.findByIdAndDelete(
    datasetItemId
  );

  // ==========================================================
  // DECREASE DATASET ITEM COUNT
  // ==========================================================

  await Dataset.findByIdAndUpdate(
    datasetItem.dataset,
    {
      $inc: {
        "configuration.totalItems": -1,
      },
    }
  );

  return {
    deleted: true,
    datasetItemId,
  };
};