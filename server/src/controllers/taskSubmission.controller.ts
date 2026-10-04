import { Response } from "express";

import {
  AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

import ApiError from "../utils/ApiError.js";

import {
  createTaskSubmission,
  getTaskSubmissionById,
  getTaskSubmissions,
  updateTaskSubmission,
  submitTaskSubmission,
  markSubmissionUnderReview,
} from "../services/taskSubmission.service.js";

// ============================================================
// GET ALL TASK SUBMISSIONS
// ============================================================

export const getAllTaskSubmissions =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required"
      );
    }

    const taskId =
      typeof req.query.taskId ===
      "string"
        ? req.query.taskId
        : undefined;

    const contributorId =
      typeof req.query.contributorId ===
      "string"
        ? req.query.contributorId
        : undefined;

    const status =
      typeof req.query.status ===
      "string"
        ? req.query.status
        : undefined;

    const submissions =
      await getTaskSubmissions(
        req.user.userId,
        req.user.role,
        {
          taskId,
          contributorId,
          status,
        }
      );

    res.status(200).json({
      success: true,
      message:
        "Task submissions fetched successfully",
      data: {
        submissions,
      },
    });
  };

// ============================================================
// GET TASK SUBMISSION BY ID
// ============================================================

export const getTaskSubmission =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    const submissionId =
      typeof req.params
        .taskSubmissionId ===
      "string"
        ? req.params.taskSubmissionId
        : undefined;

    if (!submissionId) {
      throw new ApiError(
        400,
        "Task submission ID is required"
      );
    }

    const submission =
      await getTaskSubmissionById(
        submissionId,
        req.user?.userId,
        req.user?.role
      );

    res.status(200).json({
      success: true,
      message:
        "Task submission fetched successfully",
      data: {
        submission,
      },
    });
  };

// ============================================================
// CREATE TASK SUBMISSION
// ============================================================

export const createNewTaskSubmission =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required"
      );
    }

    if (
      req.user.role !==
      "CONTRIBUTOR"
    ) {
      throw new ApiError(
        403,
        "Only contributors can create task submissions"
      );
    }

    const submission =
      await createTaskSubmission(
        req.user.userId,
        req.body
      );

    res.status(201).json({
      success: true,
      message:
        "Task submission created successfully",
      data: {
        submission,
      },
    });
  };

// ============================================================
// UPDATE TASK SUBMISSION
// ============================================================

export const updateExistingTaskSubmission =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required"
      );
    }

    if (
      req.user.role !==
      "CONTRIBUTOR"
    ) {
      throw new ApiError(
        403,
        "Only contributors can update task submissions"
      );
    }

    const submissionId =
      typeof req.params
        .taskSubmissionId ===
      "string"
        ? req.params.taskSubmissionId
        : undefined;

    if (!submissionId) {
      throw new ApiError(
        400,
        "Task submission ID is required"
      );
    }

    const submission =
      await updateTaskSubmission(
        submissionId,
        req.user.userId,
        req.body
      );

    res.status(200).json({
      success: true,
      message:
        "Task submission updated successfully",
      data: {
        submission,
      },
    });
  };

// ============================================================
// SUBMIT TASK SUBMISSION
// ============================================================

export const submitExistingTaskSubmission =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required"
      );
    }

    if (
      req.user.role !==
      "CONTRIBUTOR"
    ) {
      throw new ApiError(
        403,
        "Only contributors can submit task submissions"
      );
    }

    const submissionId =
      typeof req.params
        .taskSubmissionId ===
      "string"
        ? req.params.taskSubmissionId
        : undefined;

    if (!submissionId) {
      throw new ApiError(
        400,
        "Task submission ID is required"
      );
    }

    const result =
      await submitTaskSubmission(
        submissionId,
        req.user.userId,
        req.body
      );

    res.status(200).json({
      success: true,
      message:
        "Task submitted successfully",
      data: result,
    });
  };

// ============================================================
// MARK SUBMISSION UNDER REVIEW
// ============================================================

export const moveSubmissionToReview =
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required"
      );
    }

    const allowedRoles = [
      "SUPER_ADMIN",
      "ADMIN",
      "REVIEWER",
    ];

    if (
      !allowedRoles.includes(
        req.user.role
      )
    ) {
      throw new ApiError(
        403,
        "Only admins and reviewers can move submissions to review"
      );
    }

    const submissionId =
      typeof req.params
        .taskSubmissionId ===
      "string"
        ? req.params.taskSubmissionId
        : undefined;

    if (!submissionId) {
      throw new ApiError(
        400,
        "Task submission ID is required"
      );
    }

    const submission =
      await markSubmissionUnderReview(
        submissionId
      );

    res.status(200).json({
      success: true,
      message:
        "Submission moved to review successfully",
      data: {
        submission,
      },
    });
  };