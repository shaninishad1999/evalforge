import { Response } from "express";

import {
  AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

import {
  getAdminUsers,
  getAdminUserById,
  updateAdminUserRole,
  updateAdminUserActiveStatus,
  updateAdminUserVerification,
} from "../services/adminUser.service.js";

import {
  getAdminUsersQuerySchema,
  adminUserIdParamSchema,
  updateAdminUserRoleSchema,
  updateAdminUserActiveStatusSchema,
  updateAdminUserVerificationSchema,
} from "../validations/adminUser.validation.js";

import asyncHandler from "../utils/asyncHandler.js";

// ============================================================
// GET USERS
// ============================================================

export const getAdminUsersController =
  asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response
    ) => {
      // ======================================================
      // AUTH USER
      // ======================================================

      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      // ======================================================
      // VALIDATE QUERY
      // ======================================================

      const filters =
        getAdminUsersQuerySchema.parse(
          req.query
        );

      // ======================================================
      // GET USERS
      // ======================================================

      const result =
        await getAdminUsers(
          user.userId,
          user.role,
          filters
        );

      return res.status(200).json({
        success: true,
        message:
          "Users fetched successfully",
        data: result,
      });
    }
  );

// ============================================================
// GET USER BY ID
// ============================================================

export const getAdminUserByIdController =
  asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response
    ) => {
      // ======================================================
      // AUTH USER
      // ======================================================

      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      // ======================================================
      // VALIDATE USER ID
      // ======================================================

      const { userId } =
        adminUserIdParamSchema.parse(
          req.params
        );

      // ======================================================
      // GET USER
      // ======================================================

      const targetUser =
        await getAdminUserById(
          user.userId,
          user.role,
          userId
        );

      return res.status(200).json({
        success: true,
        message:
          "User fetched successfully",
        data: {
          user: targetUser,
        },
      });
    }
  );

// ============================================================
// UPDATE USER ROLE
// ============================================================

export const updateAdminUserRoleController =
  asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response
    ) => {
      // ======================================================
      // AUTH USER
      // ======================================================

      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      // ======================================================
      // VALIDATE USER ID
      // ======================================================

      const { userId } =
        adminUserIdParamSchema.parse(
          req.params
        );

      // ======================================================
      // VALIDATE BODY
      // ======================================================

      const { role } =
        updateAdminUserRoleSchema.parse(
          req.body
        );

      // ======================================================
      // UPDATE ROLE
      // ======================================================

      const targetUser =
        await updateAdminUserRole(
          user.userId,
          user.role,
          userId,
          role
        );

      return res.status(200).json({
        success: true,
        message:
          "User role updated successfully",
        data: {
          user: targetUser,
        },
      });
    }
  );

// ============================================================
// UPDATE ACTIVE STATUS
// ============================================================

export const updateAdminUserActiveStatusController =
  asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response
    ) => {
      // ======================================================
      // AUTH USER
      // ======================================================

      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      // ======================================================
      // VALIDATE USER ID
      // ======================================================

      const { userId } =
        adminUserIdParamSchema.parse(
          req.params
        );

      // ======================================================
      // VALIDATE BODY
      // ======================================================

      const { isActive } =
        updateAdminUserActiveStatusSchema.parse(
          req.body
        );

      // ======================================================
      // UPDATE ACTIVE STATUS
      // ======================================================

      const targetUser =
        await updateAdminUserActiveStatus(
          user.userId,
          user.role,
          userId,
          isActive
        );

      return res.status(200).json({
        success: true,
        message:
          "User active status updated successfully",
        data: {
          user: targetUser,
        },
      });
    }
  );

// ============================================================
// UPDATE VERIFICATION STATUS
// ============================================================

export const updateAdminUserVerificationController =
  asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response
    ) => {
      // ======================================================
      // AUTH USER
      // ======================================================

      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

      // ======================================================
      // VALIDATE USER ID
      // ======================================================

      const { userId } =
        adminUserIdParamSchema.parse(
          req.params
        );

      // ======================================================
      // VALIDATE BODY
      // ======================================================

      const { isVerified } =
        updateAdminUserVerificationSchema.parse(
          req.body
        );

      // ======================================================
      // UPDATE VERIFICATION
      // ======================================================

      const targetUser =
        await updateAdminUserVerification(
          user.userId,
          user.role,
          userId,
          isVerified
        );

      return res.status(200).json({
        success: true,
        message:
          "User verification status updated successfully",
        data: {
          user: targetUser,
        },
      });
    }
  );