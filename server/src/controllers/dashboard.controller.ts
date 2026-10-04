import { Response } from "express";

import {
  AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

import {
  dashboardQuerySchema,
} from "../validations/dashboard.validation.js";

import {
  getDashboard,
} from "../services/dashboard.service.js";

import asyncHandler from "../utils/asyncHandler.js";

// ============================================================
// GET DASHBOARD
// ============================================================

export const getDashboardController =
  asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response
    ) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const query =
        dashboardQuerySchema.parse(req.query);

      const dashboard =
        await getDashboard(
          req.user,
          query
        );

      return res.status(200).json({
        success: true,
        message: "Dashboard fetched successfully",
        data: dashboard,
      });
    }
  );