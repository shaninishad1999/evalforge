import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = Router();

router.get(
  "/dashboard",
  authenticate,
  authorize("CONTRIBUTOR"),
  asyncHandler(async (_req, res) => {
    res.status(200).json({
      success: true,
      message: "Contributor dashboard access granted",
    });
  })
);

export default router;