import { Router } from "express";

import {
  authenticate,
} from "../middleware/auth.middleware.js";

import asyncHandler from "../utils/asyncHandler.js";

import {
  getAllDatasets,
  getDataset,
  createNewDataset,
  updateExistingDataset,
  removeDataset,
} from "../controllers/dataset.controller.js";

const router = Router();

// ============================================================
// AUTHENTICATION
// ============================================================

router.use(authenticate);

// ============================================================
// DATASET ROUTES
// ============================================================

// GET /api/datasets
router.get(
  "/",
  asyncHandler(getAllDatasets)
);

// POST /api/datasets
router.post(
  "/",
  asyncHandler(createNewDataset)
);

// GET /api/datasets/:datasetId
router.get(
  "/:datasetId",
  asyncHandler(getDataset)
);

// PATCH /api/datasets/:datasetId
router.patch(
  "/:datasetId",
  asyncHandler(updateExistingDataset)
);

// DELETE /api/datasets/:datasetId
router.delete(
  "/:datasetId",
  asyncHandler(removeDataset)
);

export default router;