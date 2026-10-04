import { Router } from "express";

import {
  register,
  login,
  getMe,
  refreshAccessToken,
  logout
} from "../controllers/auth.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

import {
  authRateLimiter,
} from "../middleware/rateLimit.middleware.js";

import asyncHandler from "../utils/asyncHandler.js";

const router = Router();

// ============================================================
// AUTHENTICATION ROUTES
// ============================================================

// Registration protection
router.post(
  "/register",
  authRateLimiter,
  asyncHandler(register)
);

// Login brute-force protection
router.post(
  "/login",
  authRateLimiter,
  asyncHandler(login)
);

// Protected route
router.get(
  "/me",
  authenticate,
  asyncHandler(getMe)
);

// Refresh access token
router.post(
  "/refresh",
  asyncHandler(refreshAccessToken)
);

// Logout
router.post(
  "/logout",
  asyncHandler(logout)
);

export default router;