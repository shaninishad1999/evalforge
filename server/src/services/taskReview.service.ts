import mongoose from "mongoose";

import TaskReview from "../models/TaskReview.js";
import TaskSubmission from "../models/TaskSubmission.js";
import Task from "../models/Task.js";
import Project from "../models/Project.js";
import ApiError from "../utils/ApiError.js";

// ============================================================
// TYPES
// ============================================================

type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "CLIENT"
  | "PROJECT_MANAGER"
  | "REVIEWER"
  | "CONTRIBUTOR";

interface ReviewUser {
  userId: string;
  role: UserRole;
}

interface ReviewCriterionInput {
  criterion: string;
  score: number;
  feedback?: string;
}

interface CreateTaskReviewInput {
  task: string;
  submission: string;
  decision:
    | "APPROVED"
    | "REJECTED"
    | "REVISION";
  score?: number | null;
  feedback?: string;
  criteria?: ReviewCriterionInput[];
  status?: "PENDING" | "COMPLETED";
}

interface UpdateTaskReviewInput {
  decision?:
    | "APPROVED"
    | "REJECTED"
    | "REVISION";
  score?: number | null;
  feedback?: string;
  criteria?: ReviewCriterionInput[];
  status?: "PENDING" | "COMPLETED";
}

interface CompleteTaskReviewInput {
  decision:
    | "APPROVED"
    | "REJECTED"
    | "REVISION";
  score?: number | null;
  feedback?: string;
  criteria?: ReviewCriterionInput[];
}

// ============================================================
// HELPERS
// ============================================================

const isValidObjectId = (
  id: string
): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

const normalizeCriteria = (
  criteria?: ReviewCriterionInput[]
) => {
  return (
    criteria?.map((criterion) => ({
      criterion: criterion.criterion,
      score: criterion.score,
      feedback: criterion.feedback ?? "",
    })) ?? []
  );
};

const canReviewTask = (
  role: UserRole
): boolean => {
  return (
    role === "SUPER_ADMIN" ||
    role === "ADMIN" ||
    role === "REVIEWER"
  );
};

// ============================================================
// CREATE TASK REVIEW
// ============================================================

export const createTaskReview = async (
  data: CreateTaskReviewInput,
  user: ReviewUser
) => {
  if (!canReviewTask(user.role)) {
    throw new ApiError(
      403,
      "You are not allowed to review tasks"
    );
  }

  if (!isValidObjectId(data.task)) {
    throw new ApiError(
      400,
      "Invalid task ID"
    );
  }

  if (!isValidObjectId(data.submission)) {
    throw new ApiError(
      400,
      "Invalid task submission ID"
    );
  }

  const task = await Task.findById(
    data.task
  );

  if (!task) {
    throw new ApiError(
      404,
      "Task not found"
    );
  }

  const submission =
    await TaskSubmission.findById(
      data.submission
    );

  if (!submission) {
    throw new ApiError(
      404,
      "Task submission not found"
    );
  }

  if (
    submission.task.toString() !==
    task._id.toString()
  ) {
    throw new ApiError(
      400,
      "Task and submission do not match"
    );
  }

  if (
    submission.status !== "SUBMITTED" &&
    submission.status !== "UNDER_REVIEW"
  ) {
    throw new ApiError(
      400,
      "Only submitted submissions can be reviewed"
    );
  }

  const existingReview =
    await TaskReview.findOne({
      submission: submission._id,
      status: "COMPLETED",
    });

  if (existingReview) {
    throw new ApiError(
      409,
      "This submission has already been reviewed"
    );
  }

  const project = await Project.findById(
    submission.project
  );

  if (!project) {
    throw new ApiError(
      404,
      "Project not found"
    );
  }

  const review =
    await TaskReview.create({
      task: task._id,
      submission: submission._id,
      project: submission.project,
      contributor: submission.contributor,
      reviewer: new mongoose.Types.ObjectId(
        user.userId
      ),
      decision: data.decision,
      score: data.score ?? null,
      feedback: data.feedback ?? "",
      criteria: normalizeCriteria(
        data.criteria
      ),
      status: data.status ?? "COMPLETED",
      reviewedAt:
        data.status === "PENDING"
          ? null
          : new Date(),
    });

  if (review.status === "COMPLETED") {
    await applyReviewDecision(
      task,
      submission,
      review.decision
    );
  }

  return review;
};

// ============================================================
// GET TASK REVIEW BY ID
// ============================================================

export const getTaskReviewById =
  async (
    reviewId: string,
    user: ReviewUser
  ) => {
    if (!isValidObjectId(reviewId)) {
      throw new ApiError(
        400,
        "Invalid task review ID"
      );
    }

    const review =
      await TaskReview.findById(
        reviewId
      )
        .populate(
          "reviewer",
          "name email role"
        )
        .populate(
          "contributor",
          "name email role"
        )
        .populate(
          "task",
          "title type status"
        )
        .populate(
          "submission"
        )
        .populate(
          "project",
          "title status"
        );

    if (!review) {
      throw new ApiError(
        404,
        "Task review not found"
      );
    }

    const canView =
      user.role === "SUPER_ADMIN" ||
      user.role === "ADMIN" ||
      user.role === "REVIEWER" ||
      review.contributor.toString() ===
        user.userId;

    if (!canView) {
      throw new ApiError(
        403,
        "You are not allowed to view this review"
      );
    }

    return review;
  };

// ============================================================
// GET TASK REVIEWS
// ============================================================

export const getTaskReviews =
  async (
    user: ReviewUser,
    filters?: {
      task?: string;
      submission?: string;
      project?: string;
      contributor?: string;
      reviewer?: string;
      decision?:
        | "APPROVED"
        | "REJECTED"
        | "REVISION";
      status?:
        | "PENDING"
        | "COMPLETED";
    }
  ) => {
    const query: Record<
      string,
      unknown
    > = {};

    if (
      filters?.task &&
      isValidObjectId(filters.task)
    ) {
      query.task =
        filters.task;
    }

    if (
      filters?.submission &&
      isValidObjectId(
        filters.submission
      )
    ) {
      query.submission =
        filters.submission;
    }

    if (
      filters?.project &&
      isValidObjectId(
        filters.project
      )
    ) {
      query.project =
        filters.project;
    }

    if (
      filters?.contributor &&
      isValidObjectId(
        filters.contributor
      )
    ) {
      query.contributor =
        filters.contributor;
    }

    if (
      filters?.reviewer &&
      isValidObjectId(
        filters.reviewer
      )
    ) {
      query.reviewer =
        filters.reviewer;
    }

    if (filters?.decision) {
      query.decision =
        filters.decision;
    }

    if (filters?.status) {
      query.status =
        filters.status;
    }

    if (user.role === "REVIEWER") {
      query.reviewer =
        user.userId;
    }

    if (user.role === "CONTRIBUTOR") {
      query.contributor =
        user.userId;
    }

    if (
      user.role !== "SUPER_ADMIN" &&
      user.role !== "ADMIN" &&
      user.role !== "REVIEWER" &&
      user.role !== "CONTRIBUTOR"
    ) {
      throw new ApiError(
        403,
        "You are not allowed to view task reviews"
      );
    }

    return TaskReview.find(query)
      .populate(
        "reviewer",
        "name email role"
      )
      .populate(
        "contributor",
        "name email role"
      )
      .populate(
        "task",
        "title type status"
      )
      .populate(
        "project",
        "title status"
      )
      .sort({
        createdAt: -1,
      });
  };

// ============================================================
// UPDATE TASK REVIEW
// ============================================================

export const updateTaskReview =
  async (
    reviewId: string,
    data: UpdateTaskReviewInput,
    user: ReviewUser
  ) => {
    if (!canReviewTask(user.role)) {
      throw new ApiError(
        403,
        "You are not allowed to update task reviews"
      );
    }

    if (!isValidObjectId(reviewId)) {
      throw new ApiError(
        400,
        "Invalid task review ID"
      );
    }

    const review =
      await TaskReview.findById(
        reviewId
      );

    if (!review) {
      throw new ApiError(
        404,
        "Task review not found"
      );
    }

    if (
      review.status === "COMPLETED"
    ) {
      throw new ApiError(
        400,
        "Completed reviews cannot be updated"
      );
    }

    if (
      data.decision !== undefined
    ) {
      review.decision =
        data.decision;
    }

    if (
      data.score !== undefined
    ) {
      review.score =
        data.score;
    }

    if (
      data.feedback !== undefined
    ) {
      review.feedback =
        data.feedback;
    }

    if (
      data.criteria !== undefined
    ) {
      review.criteria =
        normalizeCriteria(
          data.criteria
        );
    }

    if (
      data.status !== undefined
    ) {
      review.status =
        data.status;

      if (
        data.status === "COMPLETED"
      ) {
        review.reviewedAt =
          new Date();
      }
    }

    await review.save();

    if (
      review.status === "COMPLETED"
    ) {
      const task =
        await Task.findById(
          review.task
        );

      const submission =
        await TaskSubmission.findById(
          review.submission
        );

      if (!task || !submission) {
        throw new ApiError(
          404,
          "Task or submission not found"
        );
      }

      await applyReviewDecision(
        task,
        submission,
        review.decision
      );
    }

    return review;
  };

// ============================================================
// COMPLETE TASK REVIEW
// ============================================================

export const completeTaskReview =
  async (
    reviewId: string,
    data: CompleteTaskReviewInput,
    user: ReviewUser
  ) => {
    if (!canReviewTask(user.role)) {
      throw new ApiError(
        403,
        "You are not allowed to complete task reviews"
      );
    }

    if (!isValidObjectId(reviewId)) {
      throw new ApiError(
        400,
        "Invalid task review ID"
      );
    }

    const review =
      await TaskReview.findById(
        reviewId
      );

    if (!review) {
      throw new ApiError(
        404,
        "Task review not found"
      );
    }

    if (
      review.status === "COMPLETED"
    ) {
      throw new ApiError(
        400,
        "Task review is already completed"
      );
    }

    review.decision =
      data.decision;

    review.score =
      data.score ?? null;

    review.feedback =
      data.feedback ?? "";

    review.criteria =
      normalizeCriteria(
        data.criteria
      );

    review.status =
      "COMPLETED";

    review.reviewedAt =
      new Date();

    await review.save();

    const task =
      await Task.findById(
        review.task
      );

    const submission =
      await TaskSubmission.findById(
        review.submission
      );

    if (!task || !submission) {
      throw new ApiError(
        404,
        "Task or submission not found"
      );
    }

    await applyReviewDecision(
      task,
      submission,
      review.decision
    );

    return review;
  };

// ============================================================
// APPLY REVIEW DECISION
// ============================================================

const applyReviewDecision =
  async (
    task: mongoose.Document &
      {
        status: string;
        reviewedAt: Date | null;
        save: () => Promise<unknown>;
      },
    submission:
      mongoose.Document & {
        status: string;
        reviewedAt: Date | null;
        revisionRequestedAt:
          | Date
          | null;
        save: () => Promise<unknown>;
      },
    decision:
      | "APPROVED"
      | "REJECTED"
      | "REVISION"
  ) => {
    const now = new Date();

    if (decision === "APPROVED") {
      task.status =
        "APPROVED";

      submission.status =
        "APPROVED";

      submission.reviewedAt =
        now;

      submission.revisionRequestedAt =
        null;
    }

    if (decision === "REJECTED") {
      task.status =
        "REJECTED";

      submission.status =
        "REJECTED";

      submission.reviewedAt =
        now;

      submission.revisionRequestedAt =
        null;
    }

    if (decision === "REVISION") {
      task.status =
        "REVISION";

      submission.status =
        "REVISION";

      submission.reviewedAt =
        now;

      submission.revisionRequestedAt =
        now;
    }

    task.reviewedAt = now;

    await task.save();
    await submission.save();
  };