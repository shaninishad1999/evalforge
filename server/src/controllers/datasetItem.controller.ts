import { Response } from "express";

import {
  AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

import ApiError from "../utils/ApiError.js";

import {
  createDatasetItem,
  getDatasetItemById,
  getDatasetItems,
  updateDatasetItem,
  deleteDatasetItem,
} from "../services/datasetItem.service.js";

// ============================================================
// GET ALL DATASET ITEMS
// ============================================================

export const getAllDatasetItems = async (
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
    typeof req.query.datasetId ===
    "string"
      ? req.query.datasetId
      : undefined;

  const datasetItems =
    await getDatasetItems(
      req.user.userId,
      req.user.role,
      datasetId
    );

  res.status(200).json({
    success: true,
    message:
      "Dataset items fetched successfully",
    data: {
      datasetItems,
    },
  });
};

// ============================================================
// GET DATASET ITEM BY ID
// ============================================================

export const getDatasetItem = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const datasetItemId =
    typeof req.params.datasetItemId ===
    "string"
      ? req.params.datasetItemId
      : undefined;

  if (!datasetItemId) {
    throw new ApiError(
      400,
      "Dataset item ID is required"
    );
  }

  const datasetItem =
    await getDatasetItemById(
      datasetItemId,
      req.user?.userId,
      req.user?.role
    );

  res.status(200).json({
    success: true,
    message:
      "Dataset item fetched successfully",
    data: {
      datasetItem,
    },
  });
};

// ============================================================
// CREATE DATASET ITEM
// ============================================================

export const createNewDatasetItem =
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

    const datasetItem =
      await createDatasetItem(
        req.user.userId,
        req.user.role,
        req.body
      );

    res.status(201).json({
      success: true,
      message:
        "Dataset item created successfully",
      data: {
        datasetItem,
      },
    });
  };

// ============================================================
// UPDATE DATASET ITEM
// ============================================================

export const updateExistingDatasetItem =
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

    const datasetItemId =
      typeof req.params.datasetItemId ===
      "string"
        ? req.params.datasetItemId
        : undefined;

    if (!datasetItemId) {
      throw new ApiError(
        400,
        "Dataset item ID is required"
      );
    }

    const datasetItem =
      await updateDatasetItem(
        datasetItemId,
        req.user.userId,
        req.user.role,
        req.body
      );

    res.status(200).json({
      success: true,
      message:
        "Dataset item updated successfully",
      data: {
        datasetItem,
      },
    });
  };

// ============================================================
// DELETE DATASET ITEM
// ============================================================

export const removeDatasetItem = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    throw new ApiError(
      401,
      "Authentication required"
    );
  }

  const datasetItemId =
    typeof req.params.datasetItemId ===
    "string"
      ? req.params.datasetItemId
      : undefined;

  if (!datasetItemId) {
    throw new ApiError(
      400,
      "Dataset item ID is required"
    );
  }

  const result =
    await deleteDatasetItem(
      datasetItemId,
      req.user.userId,
      req.user.role
    );

  res.status(200).json({
    success: true,
    message:
      "Dataset item deleted successfully",
    data: result,
  });
};