import { Router } from "express";

import {
  createProjectAssignmentController,
  getProjectAssignmentByIdController,
  getMyProjectAssignmentsController,
  getProjectAssignmentsController,
  updateProjectAssignmentController,
  changeProjectAssignmentStatusController,
  removeProjectAssignmentController,
} from "../controllers/projectAssignment.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

import { authorize } from "../middleware/role.middleware.js";

import asyncHandler from "../utils/asyncHandler.js";

const router = Router();

// ============================================================
// PROJECT ASSIGNMENTS
// ============================================================

// Create project assignment
// POST /api/project-assignments
router.post(
  "/",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "ADMIN",
    "CLIENT",
    "PROJECT_MANAGER"
  ),
  asyncHandler(
    createProjectAssignmentController
  )
);

// Get my project assignments
// GET /api/project-assignments/my
router.get(
  "/my",
  authenticate,
  authorize("CONTRIBUTOR"),
  asyncHandler(
    getMyProjectAssignmentsController
  )
);

// Get all assignments for a project
// GET /api/project-assignments/project/:projectId
router.get(
  "/project/:projectId",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "ADMIN",
    "CLIENT",
    "PROJECT_MANAGER"
  ),
  asyncHandler(
    getProjectAssignmentsController
  )
);

// Get assignment by ID
// GET /api/project-assignments/:assignmentId
router.get(
  "/:assignmentId",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "ADMIN",
    "CLIENT",
    "PROJECT_MANAGER",
    "CONTRIBUTOR"
  ),
  asyncHandler(
    getProjectAssignmentByIdController
  )
);

// Update assignment
// PATCH /api/project-assignments/:assignmentId
router.patch(
  "/:assignmentId",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "ADMIN",
    "CLIENT",
    "PROJECT_MANAGER",
    "CONTRIBUTOR"
  ),
  asyncHandler(
    updateProjectAssignmentController
  )
);

// Change assignment status
// PATCH /api/project-assignments/:assignmentId/status
router.patch(
  "/:assignmentId/status",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "ADMIN",
    "CLIENT",
    "PROJECT_MANAGER",
    "CONTRIBUTOR"
  ),
  asyncHandler(
    changeProjectAssignmentStatusController
  )
);

// Remove assignment
// PATCH /api/project-assignments/:assignmentId/remove
router.patch(
  "/:assignmentId/remove",
  authenticate,
  authorize(
    "SUPER_ADMIN",
    "ADMIN",
    "CLIENT",
    "PROJECT_MANAGER"
  ),
  asyncHandler(
    removeProjectAssignmentController
  )
);

export default router;