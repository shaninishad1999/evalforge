import { Router } from "express";

import {
  register,
  login,
  getMe,
  refreshAccessToken,
  logout
} from "../controllers/auth.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = Router();

router.post("/register", asyncHandler(register));

router.post("/login", asyncHandler(login));

// Protected route
router.get("/me", authenticate, asyncHandler(getMe));

router.post("/refresh", asyncHandler(refreshAccessToken));
router.post("/logout",asyncHandler(logout));

export default router;