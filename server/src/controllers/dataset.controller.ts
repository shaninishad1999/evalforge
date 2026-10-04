import { Response } from "express";

import {
  AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

import ApiError from "../utils/ApiError.js";

import {
  createDataset,
  getDatasetById,
  getDatasets,
  updateDataset,
  deleteDataset,
} from "../services/dataset.service.js";

// ============================================================
// GET DATASETS
// GET /api/datasets
// ============================================================

export const getAllDatasets = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    throw new ApiError(
      401,
      "Authentication required"
    );
  }

  const datasets = await getDatasets(
    req.user.userId,
    req.user.role
  );

  res.status(200).json({
    success: true,
    message:
      "Datasets fetched successfully",
    data: {
      datasets,
    },
  });
};

// ============================================================
// GET DATASET BY ID
// GET /api/datasets/:datasetId
// ============================================================

export const getDataset = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const datasetId =
    typeof req.params.datasetId === "string"
      ? req.params.datasetId
      : undefined;

  if (!datasetId) {
    throw new ApiError(
      400,
      "Dataset ID is required"
    );
  }

  const dataset =
    await getDatasetById(
      datasetId,
      req.user?.userId,
      req.user?.role
    );

  res.status(200).json({
    success: true,
    message:
      "Dataset fetched successfully",
    data: {
      dataset,
    },
  });
};

// ============================================================
// CREATE DATASET
// POST /api/datasets
// ============================================================

export const createNewDataset = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    throw new ApiError(
      401,
      "Authentication required"
    );
  }

  const dataset =
    await createDataset(
      req.user.userId,
      req.user.role,
      req.body
    );

  res.status(201).json({
    success: true,
    message:
      "Dataset created successfully",
    data: {
      dataset,
    },
  });
};

// ============================================================
// UPDATE DATASET
// PATCH /api/datasets/:datasetId
// ============================================================

export const updateExistingDataset =
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

    const datasetId =
      typeof req.params.datasetId ===
      "string"
        ? req.params.datasetId
        : undefined;

    if (!datasetId) {
      throw new ApiError(
        400,
        "Dataset ID is required"
      );
    }

    const dataset =
      await updateDataset(
        datasetId,
        req.user.userId,
        req.user.role,
        req.body
      );

    res.status(200).json({
      success: true,
      message:
        "Dataset updated successfully",
      data: {
        dataset,
      },
    });
  };

// ============================================================
// DELETE DATASET
// DELETE /api/datasets/:datasetId
// ============================================================

export const removeDataset = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    throw new ApiError(
      401,
      "Authentication required"
    );
  }

  const datasetId =
    typeof req.params.datasetId === "string"
      ? req.params.datasetId
      : undefined;

  if (!datasetId) {
    throw new ApiError(
      400,
      "Dataset ID is required"
    );
  }

  const result =
    await deleteDataset(
      datasetId,
      req.user.userId,
      req.user.role
    );

  res.status(200).json({
    success: true,
    message:
      "Dataset deleted successfully",
    data: result,
  });
};