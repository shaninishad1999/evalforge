import { Router } from "express";

import {
  getDashboardController,
} from "../controllers/dashboard.controller.js";

import {
  authenticate,
} from "../middleware/auth.middleware.js";

import {
  authorize,
} from "../middleware/role.middleware.js";

// ============================================================
// ROUTER
// ============================================================

const router = Router();

// ============================================================
// GET CURRENT USER DASHBOARD
// ============================================================

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
  getDashboardController
);

export default router;