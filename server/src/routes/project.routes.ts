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
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

// ============================================================
// PROJECT ROUTES
// ============================================================

// Create project
// POST /api/projects
//
// Allowed:
// SUPER_ADMIN
// ADMIN
// CLIENT
// PROJECT_MANAGER
router.post(
  "/",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "ADMIN",
    "CLIENT",
    "PROJECT_MANAGER"
  ),
  createProjectController
);

// Get all projects
// GET /api/projects
//
// Access is handled by project service based on role
// and project ownership/visibility.
router.get(
  "/",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "ADMIN",
    "CLIENT",
    "PROJECT_MANAGER",
    "REVIEWER",
    "CONTRIBUTOR"
  ),
  getProjectsController
);

// Get project by ID
// GET /api/projects/:projectId
//
// Service handles:
// - Admin access
// - Client ownership
// - Project Manager assignment
// - Published/Active public project access
router.get(
  "/:projectId",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "ADMIN",
    "CLIENT",
    "PROJECT_MANAGER",
    "REVIEWER",
    "CONTRIBUTOR"
  ),
  getProjectByIdController
);

// Update project
// PATCH /api/projects/:projectId
//
// Basic role check at route level.
// Actual project ownership is checked inside service.
router.patch(
  "/:projectId",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "ADMIN",
    "CLIENT",
    "PROJECT_MANAGER"
  ),
  updateProjectController
);

// Change project status
// PATCH /api/projects/:projectId/status
//
// Actual ownership/management permission is checked
// inside project service.
router.patch(
  "/:projectId/status",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "ADMIN",
    "CLIENT",
    "PROJECT_MANAGER"
  ),
  changeProjectStatusController
);

// Archive project
// PATCH /api/projects/:projectId/archive
//
// Actual ownership/management permission is checked
// inside project service.
router.patch(
  "/:projectId/archive",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "ADMIN",
    "CLIENT",
    "PROJECT_MANAGER"
  ),
  archiveProjectController
);

export default router;