import mongoose from "mongoose";

import TaskReview from "../models/TaskReview.js";
import TaskSubmission from "../models/TaskSubmission.js";
import Task from "../models/Task.js";
import Project from "../models/Project.js";

import ApiError from "../utils/ApiError.js";

import {
  createTaskEarningForApprovedSubmission,
} from "./earning.service.js";

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

// ============================================================
// NORMALIZE CRITERIA
// ============================================================

const normalizeCriteria = (
  criteria?: ReviewCriterionInput[]
) => {
  return (
    criteria?.map((criterion) => ({
      criterion:
        criterion.criterion,

      score:
        criterion.score,

      feedback:
        criterion.feedback ?? "",
    })) ?? []
  );
};

// ============================================================
// CHECK REVIEWER PERMISSION
// ============================================================

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
// VERIFY REVIEWER USER ID
// ============================================================

const validateReviewer = (
  user: ReviewUser
) => {
  if (
    !isValidObjectId(
      user.userId
    )
  ) {
    throw new ApiError(
      400,
      "Invalid reviewer ID"
    );
  }

  if (
    !canReviewTask(user.role)
  ) {
    throw new ApiError(
      403,
      "You are not allowed to review tasks"
    );
  }
};

// ============================================================
// CREATE TASK REVIEW
// ============================================================

export const createTaskReview =
  async (
    data: CreateTaskReviewInput,
    user: ReviewUser
  ) => {
    validateReviewer(user);

    // ========================================================
    // VALIDATE TASK ID
    // ========================================================

    if (
      !isValidObjectId(
        data.task
      )
    ) {
      throw new ApiError(
        400,
        "Invalid task ID"
      );
    }

    // ========================================================
    // VALIDATE SUBMISSION ID
    // ========================================================

    if (
      !isValidObjectId(
        data.submission
      )
    ) {
      throw new ApiError(
        400,
        "Invalid task submission ID"
      );
    }

    // ========================================================
    // FIND TASK
    // ========================================================

    const task =
      await Task.findById(
        data.task
      );

    if (!task) {
      throw new ApiError(
        404,
        "Task not found"
      );
    }

    // ========================================================
    // FIND SUBMISSION
    // ========================================================

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

    // ========================================================
    // VERIFY TASK / SUBMISSION RELATION
    // ========================================================

    if (
      submission.task.toString() !==
      task._id.toString()
    ) {
      throw new ApiError(
        400,
        "Task and submission do not match"
      );
    }

    // ========================================================
    // VERIFY PROJECT
    // ========================================================

    if (!task.project) {
      throw new ApiError(
        400,
        "Task is not associated with a project"
      );
    }

    if (
      submission.project.toString() !==
      task.project.toString()
    ) {
      throw new ApiError(
        400,
        "Task and submission project do not match"
      );
    }

    const project =
      await Project.findById(
        task.project
      );

    if (!project) {
      throw new ApiError(
        404,
        "Project not found"
      );
    }

    // ========================================================
    // VERIFY SUBMISSION STATUS
    // ========================================================

    if (
      submission.status !==
        "SUBMITTED" &&
      submission.status !==
        "UNDER_REVIEW"
    ) {
      throw new ApiError(
        400,
        "Only submitted submissions can be reviewed"
      );
    }

    // ========================================================
    // VERIFY TASK STATUS
    // ========================================================

    if (
      task.status !==
        "SUBMITTED" &&
      task.status !==
        "UNDER_REVIEW"
    ) {
      throw new ApiError(
        400,
        "Task is not ready for review"
      );
    }

    // ========================================================
    // CHECK EXISTING COMPLETED REVIEW
    // ========================================================

    const existingReview =
      await TaskReview.findOne({
        submission:
          submission._id,

        status:
          "COMPLETED",
      });

    if (existingReview) {
      throw new ApiError(
        409,
        "This submission has already been reviewed"
      );
    }

    // ========================================================
    // PREVENT REVIEWING OWN SUBMISSION
    //
    // A contributor must never be the reviewer of their
    // own submission.
    // ========================================================

    if (
      submission.contributor.toString() ===
      user.userId
    ) {
      throw new ApiError(
        403,
        "You cannot review your own submission"
      );
    }

    // ========================================================
    // IMPORTANT:
    //
    // A review can be created as PENDING, but if it is
    // completed immediately, the decision is applied
    // server-side.
    //
    // Client cannot use review status to bypass the
    // task/submission lifecycle.
    // ========================================================

    const reviewStatus =
      data.status ===
      "PENDING"
        ? "PENDING"
        : "COMPLETED";

    const review =
      await TaskReview.create({
        task:
          task._id,

        submission:
          submission._id,

        project:
          submission.project,

        contributor:
          submission.contributor,

        reviewer:
          new mongoose.Types.ObjectId(
            user.userId
          ),

        decision:
          data.decision,

        score:
          data.score ?? null,

        feedback:
          data.feedback ?? "",

        criteria:
          normalizeCriteria(
            data.criteria
          ),

        status:
          reviewStatus,

        reviewedAt:
          reviewStatus ===
          "COMPLETED"
            ? new Date()
            : null,
      });

    // ========================================================
    // APPLY DECISION ONLY WHEN COMPLETED
    // ========================================================

    if (
      review.status ===
      "COMPLETED"
    ) {
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
    validateReviewer(user);

    if (
      !isValidObjectId(
        reviewId
      )
    ) {
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

    // ========================================================
    // ADMIN / REVIEWER
    // ========================================================

    const privilegedAccess =
      user.role ===
        "SUPER_ADMIN" ||
      user.role === "ADMIN" ||
      user.role ===
        "REVIEWER";

    // ========================================================
    // CONTRIBUTOR
    // ========================================================

    const contributorAccess =
      review.contributor.toString() ===
      user.userId;

    if (
      !privilegedAccess &&
      !contributorAccess
    ) {
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
    if (
      !canReviewTask(
        user.role
      ) &&
      user.role !==
        "CONTRIBUTOR"
    ) {
      throw new ApiError(
        403,
        "You are not allowed to view task reviews"
      );
    }

    if (
      !isValidObjectId(
        user.userId
      )
    ) {
      throw new ApiError(
        400,
        "Invalid user ID"
      );
    }

    const query: Record<
      string,
      unknown
    > = {};

    // ========================================================
    // TASK FILTER
    // ========================================================

    if (
      filters?.task
    ) {
      if (
        !isValidObjectId(
          filters.task
        )
      ) {
        throw new ApiError(
          400,
          "Invalid task ID"
        );
      }

      query.task =
        filters.task;
    }

    // ========================================================
    // SUBMISSION FILTER
    // ========================================================

    if (
      filters?.submission
    ) {
      if (
        !isValidObjectId(
          filters.submission
        )
      ) {
        throw new ApiError(
          400,
          "Invalid submission ID"
        );
      }

      query.submission =
        filters.submission;
    }

    // ========================================================
    // PROJECT FILTER
    // ========================================================

    if (
      filters?.project
    ) {
      if (
        !isValidObjectId(
          filters.project
        )
      ) {
        throw new ApiError(
          400,
          "Invalid project ID"
        );
      }

      query.project =
        filters.project;
    }

    // ========================================================
    // CONTRIBUTOR FILTER
    // ========================================================

    if (
      filters?.contributor
    ) {
      if (
        !isValidObjectId(
          filters.contributor
        )
      ) {
        throw new ApiError(
          400,
          "Invalid contributor ID"
        );
      }

      query.contributor =
        filters.contributor;
    }

    // ========================================================
    // REVIEWER FILTER
    // ========================================================

    if (
      filters?.reviewer
    ) {
      if (
        !isValidObjectId(
          filters.reviewer
        )
      ) {
        throw new ApiError(
          400,
          "Invalid reviewer ID"
        );
      }

      query.reviewer =
        filters.reviewer;
    }

    // ========================================================
    // DECISION FILTER
    // ========================================================

    if (
      filters?.decision
    ) {
      query.decision =
        filters.decision;
    }

    // ========================================================
    // STATUS FILTER
    // ========================================================

    if (
      filters?.status
    ) {
      query.status =
        filters.status;
    }

    // ========================================================
    // REVIEWER CAN ONLY SEE THEIR REVIEWS
    // ========================================================

    if (
      user.role ===
      "REVIEWER"
    ) {
      query.reviewer =
        user.userId;
    }

    // ========================================================
    // CONTRIBUTOR CAN ONLY SEE OWN REVIEWS
    // ========================================================

    if (
      user.role ===
      "CONTRIBUTOR"
    ) {
      query.contributor =
        user.userId;
    }

    return TaskReview.find(
      query
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
    validateReviewer(user);

    if (
      !isValidObjectId(
        reviewId
      )
    ) {
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

    // ========================================================
    // ONLY REVIEWER WHO CREATED IT / ADMIN CAN UPDATE
    // ========================================================

    const isOwner =
      review.reviewer.toString() ===
      user.userId;

    const isAdmin =
      user.role ===
        "SUPER_ADMIN" ||
      user.role ===
        "ADMIN";

    if (
      !isOwner &&
      !isAdmin
    ) {
      throw new ApiError(
        403,
        "You are not allowed to update this review"
      );
    }

    // ========================================================
    // COMPLETED REVIEWS ARE IMMUTABLE
    //
    // This is important because an APPROVED task may already
    // have generated an earning.
    // ========================================================

    if (
      review.status ===
      "COMPLETED"
    ) {
      throw new ApiError(
        400,
        "Completed reviews cannot be updated"
      );
    }

    // ========================================================
    // UPDATE DECISION
    // ========================================================

    if (
      data.decision !==
      undefined
    ) {
      review.decision =
        data.decision;
    }

    // ========================================================
    // UPDATE SCORE
    // ========================================================

    if (
      data.score !==
      undefined
    ) {
      review.score =
        data.score;
    }

    // ========================================================
    // UPDATE FEEDBACK
    // ========================================================

    if (
      data.feedback !==
      undefined
    ) {
      review.feedback =
        data.feedback;
    }

    // ========================================================
    // UPDATE CRITERIA
    // ========================================================

    if (
      data.criteria !==
      undefined
    ) {
      review.criteria =
        normalizeCriteria(
          data.criteria
        );
    }

    // ========================================================
    // IMPORTANT:
    //
    // Do NOT allow the generic update endpoint to make a
    // review COMPLETED.
    //
    // Final completion must go through
    // completeTaskReview().
    // ========================================================

    if (
      data.status ===
      "COMPLETED"
    ) {
      throw new ApiError(
        400,
        "Use the complete review endpoint to finalize a review"
      );
    }

    if (
      data.status ===
      "PENDING"
    ) {
      review.status =
        "PENDING";
    }

    await review.save();

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
    validateReviewer(user);

    if (
      !isValidObjectId(
        reviewId
      )
    ) {
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

    // ========================================================
    // ONLY ORIGINAL REVIEWER OR ADMIN CAN COMPLETE
    // ========================================================

    const isOwner =
      review.reviewer.toString() ===
      user.userId;

    const isAdmin =
      user.role ===
        "SUPER_ADMIN" ||
      user.role ===
        "ADMIN";

    if (
      !isOwner &&
      !isAdmin
    ) {
      throw new ApiError(
        403,
        "You are not allowed to complete this review"
      );
    }

    // ========================================================
    // PREVENT DOUBLE COMPLETION
    // ========================================================

    if (
      review.status ===
      "COMPLETED"
    ) {
      throw new ApiError(
        409,
        "Task review is already completed"
      );
    }

    // ========================================================
    // FIND TASK
    // ========================================================

    const task =
      await Task.findById(
        review.task
      );

    if (!task) {
      throw new ApiError(
        404,
        "Task not found"
      );
    }

    // ========================================================
    // FIND SUBMISSION
    // ========================================================

    const submission =
      await TaskSubmission.findById(
        review.submission
      );

    if (!submission) {
      throw new ApiError(
        404,
        "Task submission not found"
      );
    }

    // ========================================================
    // VERIFY RELATION
    // ========================================================

    if (
      submission.task.toString() !==
      task._id.toString()
    ) {
      throw new ApiError(
        400,
        "Task and submission do not match"
      );
    }

    // ========================================================
    // VERIFY CURRENT WORKFLOW STATE
    // ========================================================

    if (
      submission.status !==
        "SUBMITTED" &&
      submission.status !==
        "UNDER_REVIEW"
    ) {
      throw new ApiError(
        400,
        "This submission is not available for final review"
      );
    }

    if (
      task.status !==
        "SUBMITTED" &&
      task.status !==
        "UNDER_REVIEW"
    ) {
      throw new ApiError(
        400,
        "Task is not available for final review"
      );
    }

    // ========================================================
    // PREVENT REVIEWER FROM REVIEWING OWN SUBMISSION
    // ========================================================

    if (
      submission.contributor.toString() ===
      user.userId
    ) {
      throw new ApiError(
        403,
        "You cannot review your own submission"
      );
    }

    // ========================================================
    // UPDATE REVIEW
    // ========================================================

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

    // ========================================================
    // APPLY HUMAN DECISION
    // ========================================================

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
//
// This function is the central point where the HUMAN REVIEWER
// decision changes the task/submission lifecycle.
//
// APPROVED
//    -> Task APPROVED
//    -> Submission APPROVED
//    -> Earning created
//
// REJECTED
//    -> Task REJECTED
//    -> Submission REJECTED
//    -> NO earning
//
// REVISION
//    -> Task REVISION
//    -> Submission REVISION
//    -> NO earning
//
// ============================================================

const applyReviewDecision =
  async (
    task: mongoose.Document & {
      _id: mongoose.Types.ObjectId;

      project:
        mongoose.Types.ObjectId;

      status: string;

      reviewedAt:
        | Date
        | null;

      save: () =>
        Promise<unknown>;
    },

    submission:
      mongoose.Document & {
        _id: mongoose.Types.ObjectId;

        task:
          mongoose.Types.ObjectId;

        contributor:
          mongoose.Types.ObjectId;

        project:
          mongoose.Types.ObjectId;

        status: string;

        reviewedAt:
          | Date
          | null;

        revisionRequestedAt:
          | Date
          | null;

        save: () =>
          Promise<unknown>;
      },

    decision:
      | "APPROVED"
      | "REJECTED"
      | "REVISION"
  ) => {
    const now =
      new Date();

    // ========================================================
    // APPROVED
    // ========================================================

    if (
      decision ===
      "APPROVED"
    ) {
      task.status =
        "APPROVED";

      submission.status =
        "APPROVED";

      submission.reviewedAt =
        now;

      submission.revisionRequestedAt =
        null;

      task.reviewedAt =
        now;

      await task.save();

      await submission.save();

      // ======================================================
      // CREATE EARNING
      //
      // This helper performs the duplicate check.
      // The database unique index will additionally protect
      // against duplicate task earnings.
      // ======================================================

      await createTaskEarningForApprovedSubmission({
        taskId:
          task._id.toString(),

        submissionId:
          submission._id.toString(),
      });

      return;
    }

    // ========================================================
    // REJECTED
    // ========================================================

    if (
      decision ===
      "REJECTED"
    ) {
      task.status =
        "REJECTED";

      submission.status =
        "REJECTED";

      submission.reviewedAt =
        now;

      submission.revisionRequestedAt =
        null;

      task.reviewedAt =
        now;

      await task.save();

      await submission.save();

      // IMPORTANT:
      // No earning is created for rejected tasks.

      return;
    }

    // ========================================================
    // REVISION
    // ========================================================

    if (
      decision ===
      "REVISION"
    ) {
      task.status =
        "REVISION";

      submission.status =
        "REVISION";

      submission.reviewedAt =
        now;

      submission.revisionRequestedAt =
        now;

      task.reviewedAt =
        now;

      await task.save();

      await submission.save();

      // IMPORTANT:
      // No earning is created for revision.
      // Contributor must work on the revision and resubmit.

      return;
    }

    throw new ApiError(
      400,
      "Invalid review decision"
    );
  };