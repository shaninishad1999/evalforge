import { Router } from "express";

import {
  createProjectController,
  getProjectsController,
  getProjectByIdController,
  updateProjectController,
  changeProjectStatusController,
  archiveProjectController,
} from "../controllers/project.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// ============================================================
// PROJECT ROUTES
// ============================================================

// Create project
// POST /api/projects
router.post(
  "/",
  authenticate,
  createProjectController
);

// Get all projects
// GET /api/projects
router.get(
  "/",
  authenticate,
  getProjectsController
);

// Get project by ID
// GET /api/projects/:projectId
router.get(
  "/:projectId",
  authenticate,
  getProjectByIdController
);

// Update project
// PATCH /api/projects/:projectId
router.patch(
  "/:projectId",
  authenticate,
  updateProjectController
);

// Change project status
// PATCH /api/projects/:projectId/status
router.patch(
  "/:projectId/status",
  authenticate,
  changeProjectStatusController
);

// Archive project
// PATCH /api/projects/:projectId/archive
router.patch(
  "/:projectId/archive",
  authenticate,
  archiveProjectController
);

export default router;