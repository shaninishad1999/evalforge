import { Response } from "express";

import {
  AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

import {
  createTaskReviewSchema,
  updateTaskReviewSchema,
  completeTaskReviewSchema,
  taskReviewIdSchema,
} from "../validations/taskReview.validation.js";

import {
  createTaskReview,
  getTaskReviewById,
  getTaskReviews,
  updateTaskReview,
  completeTaskReview,
} from "../services/taskReview.service.js";

import ApiError from "../utils/ApiError.js";

// ============================================================
// GET ALL TASK REVIEWS
// ============================================================

export const getAllTaskReviews = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    throw new ApiError(
      401,
      "Authentication required"
    );
  }

  const reviews =
    await getTaskReviews(
      req.user,
      {
        task:
          typeof req.query.task === "string"
            ? req.query.task
            : undefined,

        submission:
          typeof req.query.submission ===
          "string"
            ? req.query.submission
            : undefined,

        project:
          typeof req.query.project === "string"
            ? req.query.project
            : undefined,

        contributor:
          typeof req.query.contributor ===
          "string"
            ? req.query.contributor
            : undefined,

        reviewer:
          typeof req.query.reviewer === "string"
            ? req.query.reviewer
            : undefined,

        decision:
          typeof req.query.decision === "string"
            ? (req.query.decision as
                | "APPROVED"
                | "REJECTED"
                | "REVISION")
            : undefined,

        status:
          typeof req.query.status === "string"
            ? (req.query.status as
                | "PENDING"
                | "COMPLETED")
            : undefined,
      }
    );

  return res.status(200).json({
    success: true,
    message:
      "Task reviews fetched successfully",
    data: reviews,
  });
};

// ============================================================
// GET TASK REVIEW
// ============================================================

export const getTaskReview = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user) {
    throw new ApiError(
      401,
      "Authentication required"
    );
  }

  const parsed =
    taskReviewIdSchema.safeParse(
      req.params
    );

  if (!parsed.success) {
    throw new ApiError(
      400,
      parsed.error.issues[0]?.message ??
        "Invalid task review ID"
    );
  }

  const review =
    await getTaskReviewById(
      parsed.data.taskReviewId,
      req.user
    );

  return res.status(200).json({
    success: true,
    message:
      "Task review fetched successfully",
    data: review,
  });
};

// ============================================================
// CREATE TASK REVIEW
// ============================================================

export const createNewTaskReview =
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

    const parsed =
      createTaskReviewSchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      throw new ApiError(
        400,
        parsed.error.issues[0]?.message ??
          "Invalid task review data"
      );
    }

    const review =
      await createTaskReview(
        parsed.data,
        req.user
      );

    return res.status(201).json({
      success: true,
      message:
        "Task review created successfully",
      data: review,
    });
  };

// ============================================================
// UPDATE TASK REVIEW
// ============================================================

export const updateExistingTaskReview =
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

    const params =
      taskReviewIdSchema.safeParse(
        req.params
      );

    if (!params.success) {
      throw new ApiError(
        400,
        params.error.issues[0]?.message ??
          "Invalid task review ID"
      );
    }

    const body =
      updateTaskReviewSchema.safeParse(
        req.body
      );

    if (!body.success) {
      throw new ApiError(
        400,
        body.error.issues[0]?.message ??
          "Invalid task review data"
      );
    }

    const review =
      await updateTaskReview(
        params.data.taskReviewId,
        body.data,
        req.user
      );

    return res.status(200).json({
      success: true,
      message:
        "Task review updated successfully",
      data: review,
    });
  };

// ============================================================
// COMPLETE TASK REVIEW
// ============================================================

export const completeExistingTaskReview =
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

    const params =
      taskReviewIdSchema.safeParse(
        req.params
      );

    if (!params.success) {
      throw new ApiError(
        400,
        params.error.issues[0]?.message ??
          "Invalid task review ID"
      );
    }

    const body =
      completeTaskReviewSchema.safeParse(
        req.body
      );

    if (!body.success) {
      throw new ApiError(
        400,
        body.error.issues[0]?.message ??
          "Invalid task review data"
      );
    }

    const review =
      await completeTaskReview(
        params.data.taskReviewId,
        body.data,
        req.user
      );

    return res.status(200).json({
      success: true,
      message:
        "Task review completed successfully",
      data: review,
    });
  };