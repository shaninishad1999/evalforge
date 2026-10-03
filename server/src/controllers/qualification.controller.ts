import { Response } from "express";

import {
  AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

import asyncHandler from "../utils/asyncHandler.js";

import {
  createQualification,
  getQualificationById,
  getQualifications,
  updateQualification,
  changeQualificationStatus,
  startQualificationAttempt,
  resumeQualificationAttempt,
  pauseQualificationAttempt,
  submitQuestionAnswer,
  submitQualificationAttempt,
  getQualificationAttempt,
  getMyQualificationAttempts,
  getMyProjectAssignments,
} from "../services/qualification.service.js";

import {
  createQualificationSchema,
  updateQualificationSchema,
  updateQualificationStatusSchema,
  qualificationIdParamSchema,
  startQualificationAttemptSchema,
  submitQualificationAnswerSchema,
} from "../validations/qualification.validation.js";

// ============================================================
// CREATE QUALIFICATION
// ============================================================

export const createQualificationController =
  asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response
    ) => {
      const user = req.user;

      if (!user) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Authentication required",
          });
      }

      const validatedData =
        createQualificationSchema.parse(
          req.body
        );

      const qualification =
        await createQualification(
          user.userId,
          user.role,
          validatedData
        );

      return res
        .status(201)
        .json({
          success: true,
          message:
            "Qualification created successfully",
          data: {
            qualification,
          },
        });
    }
  );

// ============================================================
// GET ALL QUALIFICATIONS
// ============================================================

export const getQualificationsController =
  asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response
    ) => {
      const user = req.user;

      if (!user) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Authentication required",
          });
      }

      const qualifications =
        await getQualifications(
          user.userId,
          user.role
        );

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Qualifications fetched successfully",
          data: {
            qualifications,
          },
        });
    }
  );

// ============================================================
// GET QUALIFICATION BY ID
// ============================================================

export const getQualificationByIdController =
  asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response
    ) => {
      const {
        qualificationId,
      } =
        qualificationIdParamSchema.parse(
          req.params
        );

      const qualification =
        await getQualificationById(
          qualificationId,
          req.user?.userId,
          req.user?.role
        );

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Qualification fetched successfully",
          data: {
            qualification,
          },
        });
    }
  );

// ============================================================
// UPDATE QUALIFICATION
// ============================================================

export const updateQualificationController =
  asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response
    ) => {
      const user = req.user;

      if (!user) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Authentication required",
          });
      }

      const {
        qualificationId,
      } =
        qualificationIdParamSchema.parse(
          req.params
        );

      const validatedData =
        updateQualificationSchema.parse(
          req.body
        );

      const qualification =
        await updateQualification(
          qualificationId,
          user.userId,
          user.role,
          validatedData
        );

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Qualification updated successfully",
          data: {
            qualification,
          },
        });
    }
  );

// ============================================================
// CHANGE STATUS
// ============================================================

export const changeQualificationStatusController =
  asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response
    ) => {
      const user = req.user;

      if (!user) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Authentication required",
          });
      }

      const {
        qualificationId,
      } =
        qualificationIdParamSchema.parse(
          req.params
        );

      const {
        status,
      } =
        updateQualificationStatusSchema.parse(
          req.body
        );

      const qualification =
        await changeQualificationStatus(
          qualificationId,
          user.userId,
          user.role,
          status
        );

      return res
        .status(200)
        .json({
          success: true,
          message:
            `Qualification status changed to ${status}`,
          data: {
            qualification,
          },
        });
    }
  );

// ============================================================
// START ATTEMPT
// ============================================================

export const startQualificationAttemptController =
  asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response
    ) => {
      const user = req.user;

      if (!user) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Authentication required",
          });
      }

      const {
        qualificationId,
      } =
        qualificationIdParamSchema.parse(
          req.params
        );

      const {
        project,
      } =
        startQualificationAttemptSchema.parse(
          req.body ?? {}
        );

      const attempt =
        await startQualificationAttempt(
          qualificationId,
          user.userId,
          project
        );

      return res
        .status(201)
        .json({
          success: true,
          message:
            "Qualification attempt started successfully",
          data: {
            attempt,
          },
        });
    }
  );

// ============================================================
// RESUME ATTEMPT
// ============================================================

export const resumeQualificationAttemptController =
  asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response
    ) => {
      const user = req.user;

      if (!user) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Authentication required",
          });
      }

      const attemptId =
        req.params.attemptId;

      if (
        typeof attemptId !==
        "string"
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid attempt ID",
          });
      }

      const attempt =
        await resumeQualificationAttempt(
          attemptId,
          user.userId
        );

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Qualification attempt resumed successfully",
          data: {
            attempt,
          },
        });
    }
  );

// ============================================================
// PAUSE ATTEMPT
// ============================================================

export const pauseQualificationAttemptController =
  asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response
    ) => {
      const user = req.user;

      if (!user) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Authentication required",
          });
      }

      const attemptId =
        req.params.attemptId;

      if (
        typeof attemptId !==
        "string"
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid attempt ID",
          });
      }

      const attempt =
        await pauseQualificationAttempt(
          attemptId,
          user.userId
        );

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Qualification attempt paused successfully",
          data: {
            attempt,
          },
        });
    }
  );

// ============================================================
// SUBMIT QUESTION ANSWER
// ============================================================

export const submitQualificationAnswerController =
  asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response
    ) => {
      const user = req.user;

      if (!user) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Authentication required",
          });
      }

      const attemptId =
        req.params.attemptId;

      if (
        typeof attemptId !==
        "string"
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid attempt ID",
          });
      }

      const {
        questionId,
        answer,
      } =
        submitQualificationAnswerSchema.parse(
          req.body
        );

      const result =
        await submitQuestionAnswer(
          attemptId,
          user.userId,
          questionId,
          answer
        );

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Question answer submitted successfully",
          data: result,
        });
    }
  );

// ============================================================
// SUBMIT COMPLETE ASSESSMENT
// ============================================================

export const submitQualificationAttemptController =
  asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response
    ) => {
      const user = req.user;

      if (!user) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Authentication required",
          });
      }

      const attemptId =
        req.params.attemptId;

      if (
        typeof attemptId !==
        "string"
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid attempt ID",
          });
      }

      const attempt =
        await submitQualificationAttempt(
          attemptId,
          user.userId
        );

      return res
        .status(200)
        .json({
          success: true,
          message:
            attempt.result === "PASS"
              ? "Qualification passed successfully"
              : "Qualification assessment submitted",
          data: {
            attempt,
          },
        });
    }
  );

// ============================================================
// GET ATTEMPT
// ============================================================

export const getQualificationAttemptController =
  asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response
    ) => {
      const user = req.user;

      if (!user) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Authentication required",
          });
      }

      const attemptId =
        req.params.attemptId;

      if (
        typeof attemptId !==
        "string"
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid attempt ID",
          });
      }

      const attempt =
        await getQualificationAttempt(
          attemptId,
          user.userId
        );

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Qualification attempt fetched successfully",
          data: {
            attempt,
          },
        });
    }
  );

// ============================================================
// GET MY ATTEMPTS
// ============================================================

export const getMyQualificationAttemptsController =
  asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response
    ) => {
      const user = req.user;

      if (!user) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Authentication required",
          });
      }

      const qualificationId =
        typeof req.query
          .qualificationId ===
        "string"
          ? req.query
              .qualificationId
          : undefined;

      const attempts =
        await getMyQualificationAttempts(
          user.userId,
          qualificationId
        );

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Qualification attempts fetched successfully",
          data: {
            attempts,
          },
        });
    }
  );

// ============================================================
// GET MY PROJECT ASSIGNMENTS
// ============================================================

export const getMyProjectAssignmentsController =
  asyncHandler(
    async (
      req: AuthenticatedRequest,
      res: Response
    ) => {
      const user = req.user;

      if (!user) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Authentication required",
          });
      }

      const assignments =
        await getMyProjectAssignments(
          user.userId
        );

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Project assignments fetched successfully",
          data: {
            assignments,
          },
        });
    }
  );