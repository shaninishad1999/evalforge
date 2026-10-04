import { Router } from "express";

import {
  authenticate,
} from "../middleware/auth.middleware.js";

import asyncHandler from "../utils/asyncHandler.js";

import {
  getAllDatasetItems,
  getDatasetItem,
  createNewDatasetItem,
  updateExistingDatasetItem,
  removeDatasetItem,
} from "../controllers/datasetItem.controller.js";

// ============================================================
// ROUTER
// ============================================================

const router = Router();

// ============================================================
// AUTHENTICATION
// ============================================================

router.use(authenticate);

// ============================================================
// GET ALL DATASET ITEMS
// ============================================================

router.get(
  "/",
  asyncHandler(getAllDatasetItems)
);

// ============================================================
// CREATE DATASET ITEM
// ============================================================

router.post(
  "/",
  asyncHandler(createNewDatasetItem)
);

// ============================================================
// GET DATASET ITEM BY ID
// ============================================================

router.get(
  "/:datasetItemId",
  asyncHandler(getDatasetItem)
);

// ============================================================
// UPDATE DATASET ITEM
// ============================================================

router.patch(
  "/:datasetItemId",
  asyncHandler(updateExistingDatasetItem)
);

// ============================================================
// DELETE DATASET ITEM
// ============================================================

router.delete(
  "/:datasetItemId",
  asyncHandler(removeDatasetItem)
);

// ============================================================
// EXPORT
// ============================================================

export default router;