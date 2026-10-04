import mongoose from "mongoose";

import TaskSubmission from "../models/TaskSubmission.js";

import Task from "../models/Task.js";

import Project from "../models/Project.js";

import Dataset from "../models/Dataset.js";

import DatasetItem from "../models/DatasetItem.js";

import ProjectAssignment from "../models/ProjectAssignment.js";

import ApiError from "../utils/ApiError.js";

import {
  createTaskSubmissionSchema,
  updateTaskSubmissionSchema,
  submitTaskSubmissionSchema,
} from "../validations/taskSubmission.validation.js";

// ============================================================
// VALIDATE OBJECT ID
// ============================================================

const validateObjectId = (
  id: string,
  fieldName: string
): void => {
  if (
    !mongoose.Types.ObjectId.isValid(
      id
    )
  ) {
    throw new ApiError(
      400,
      `Invalid ${fieldName}`
    );
  }
};

// ============================================================
// CHECK CONTRIBUTOR PROJECT ASSIGNMENT
// ============================================================

const getContributorAssignment =
  async (
    projectId: mongoose.Types.ObjectId,
    contributorId: string
  ) => {
    return ProjectAssignment.findOne({
      project: projectId,

      contributor: contributorId,

      status: {
        $in: [
          "PENDING",
          "ACTIVE",
          "PAUSED",
        ],
      },
    });
  };

// ============================================================
// CHECK CONTRIBUTOR TASK OWNERSHIP
// ============================================================

const ensureTaskBelongsToContributor =
  (
    task: {
      claimedBy:
        | mongoose.Types.ObjectId
        | null;
    },
    contributorId: string
  ) => {
    if (
      !task.claimedBy ||
      task.claimedBy.toString() !==
        contributorId
    ) {
      throw new ApiError(
        403,
        "This task is not assigned to you"
      );
    }
  };

// ============================================================
// NORMALIZE RESPONSE
// ============================================================
//
// IMPORTANT:
//
// ranking MUST be string[].
//
// This matches TaskSubmission model and validation.
//
// ============================================================

const normalizeResponse = (
  response: {
    answer?: string;

    selectedLabel?: string;

    ranking?: string[];

    rewrittenText?: string;

    transcription?: string;

    code?: string;

    boundingBoxes?: Array<{
      label: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }>;

    evaluation?: {
      score?: number | null;

      criteria?: Array<{
        criterion: string;
        score: number;
        feedback?: string;
      }>;
    };
  },

  existingResponse?: {
    answer: string;

    selectedLabel: string;

    ranking: string[];

    rewrittenText: string;

    transcription: string;

    code: string;

    boundingBoxes: Array<{
      label: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }>;

    evaluation: {
      score: number | null;

      criteria: Array<{
        criterion: string;
        score: number;
        feedback: string;
      }>;
    };
  }
) => {
  return {
    answer:
      response.answer ??
      existingResponse?.answer ??
      "",

    selectedLabel:
      response.selectedLabel ??
      existingResponse?.selectedLabel ??
      "",

    ranking:
      response.ranking ??
      existingResponse?.ranking ??
      [],

    rewrittenText:
      response.rewrittenText ??
      existingResponse?.rewrittenText ??
      "",

    transcription:
      response.transcription ??
      existingResponse?.transcription ??
      "",

    code:
      response.code ??
      existingResponse?.code ??
      "",

    boundingBoxes:
      response.boundingBoxes ??
      existingResponse?.boundingBoxes ??
      [],

    evaluation: {
      score:
        response.evaluation?.score ??
        existingResponse?.evaluation?.score ??
        null,

      criteria:
        response.evaluation?.criteria
          ? response.evaluation.criteria.map(
              (criterion) => ({
                criterion:
                  criterion.criterion,

                score:
                  criterion.score,

                feedback:
                  criterion.feedback ??
                  "",
              })
            )
          : existingResponse
              ?.evaluation?.criteria ??
            [],
    },
  };
};

// ============================================================
// CREATE TASK SUBMISSION
// ============================================================

export const createTaskSubmission =
  async (
    contributorId: string,
    input: unknown
  ) => {
    validateObjectId(
      contributorId,
      "contributor ID"
    );

    const data =
      createTaskSubmissionSchema.parse(
        input
      );

    validateObjectId(
      data.task,
      "task ID"
    );

    validateObjectId(
      data.project,
      "project ID"
    );

    validateObjectId(
      data.dataset,
      "dataset ID"
    );

    validateObjectId(
      data.datasetItem,
      "dataset item ID"
    );

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
    // VERIFY TASK / PROJECT
    // ========================================================

    if (
      task.project.toString() !==
      data.project
    ) {
      throw new ApiError(
        400,
        "Task does not belong to the provided project"
      );
    }

    // ========================================================
    // VERIFY TASK / DATASET
    // ========================================================

    if (
      task.dataset.toString() !==
      data.dataset
    ) {
      throw new ApiError(
        400,
        "Task does not belong to the provided dataset"
      );
    }

    // ========================================================
    // VERIFY TASK / DATASET ITEM
    // ========================================================

    if (
      task.datasetItem.toString() !==
      data.datasetItem
    ) {
      throw new ApiError(
        400,
        "Task does not belong to the provided dataset item"
      );
    }

    // ========================================================
    // VERIFY TASK CLAIM
    // ========================================================

    ensureTaskBelongsToContributor(
      task,
      contributorId
    );

    // ========================================================
    // VERIFY PROJECT ASSIGNMENT
    // ========================================================

    const assignment =
      await getContributorAssignment(
        task.project,
        contributorId
      );

    if (!assignment) {
      throw new ApiError(
        403,
        "You are not assigned to this project"
      );
    }

    // ========================================================
    // VERIFY TASK STATUS
    // ========================================================

    if (
      task.status !==
        "IN_PROGRESS" &&
      task.status !==
        "REVISION"
    ) {
      throw new ApiError(
        400,
        "Task is not available for submission"
      );
    }

    // ========================================================
    // CHECK MAX ATTEMPTS
    // ========================================================

    const maxAttempts =
      task.configuration
        ?.maxAttempts ?? 3;

    const existingSubmissionCount =
      await TaskSubmission.countDocuments({
        task:
          task._id,

        contributor:
          contributorId,
      });

    if (
      existingSubmissionCount >=
      maxAttempts
    ) {
      throw new ApiError(
        400,
        "Maximum submission attempts reached for this task"
      );
    }

    const attemptNumber =
      data.attemptNumber ??
      existingSubmissionCount + 1;

    if (
      attemptNumber >
      maxAttempts
    ) {
      throw new ApiError(
        400,
        "Attempt number exceeds the maximum allowed attempts"
      );
    }

    if (
      attemptNumber < 1
    ) {
      throw new ApiError(
        400,
        "Attempt number must be at least 1"
      );
    }

    // ========================================================
    // PREVENT DUPLICATE ATTEMPT NUMBER
    // ========================================================

    const existingAttempt =
      await TaskSubmission.findOne({
        task:
          task._id,

        contributor:
          contributorId,

        attemptNumber,
      });

    if (existingAttempt) {
      throw new ApiError(
        409,
        "This submission attempt already exists"
      );
    }

    // ========================================================
    // VERIFY PROJECT
    // ========================================================

    const project =
      await Project.findById(
        data.project
      );

    if (!project) {
      throw new ApiError(
        404,
        "Project not found"
      );
    }

    // ========================================================
    // VERIFY DATASET
    // ========================================================

    const dataset =
      await Dataset.findById(
        data.dataset
      );

    if (!dataset) {
      throw new ApiError(
        404,
        "Dataset not found"
      );
    }

    if (
      dataset.project.toString() !==
      project._id.toString()
    ) {
      throw new ApiError(
        400,
        "Dataset does not belong to this project"
      );
    }

    // ========================================================
    // VERIFY DATASET ITEM
    // ========================================================

    const datasetItem =
      await DatasetItem.findById(
        data.datasetItem
      );

    if (!datasetItem) {
      throw new ApiError(
        404,
        "Dataset item not found"
      );
    }

    if (
      datasetItem.dataset.toString() !==
      dataset._id.toString()
    ) {
      throw new ApiError(
        400,
        "Dataset item does not belong to this dataset"
      );
    }

    if (
      datasetItem.project.toString() !==
      project._id.toString()
    ) {
      throw new ApiError(
        400,
        "Dataset item does not belong to this project"
      );
    }

    // ========================================================
    // CREATE DRAFT
    // ========================================================

    const submission =
      await TaskSubmission.create({
        task:
          task._id,

        project:
          project._id,

        dataset:
          dataset._id,

        datasetItem:
          datasetItem._id,

        contributor:
          new mongoose.Types.ObjectId(
            contributorId
          ),

        attemptNumber,

        response:
          normalizeResponse(
            data.response
          ),

        feedback:
          data.feedback ??
          "",

        status:
          "DRAFT",

        submittedAt:
          null,

        reviewedAt:
          null,

        revisionRequestedAt:
          null,
      });

    return submission;
  };

// ============================================================
// GET TASK SUBMISSION BY ID
// ============================================================

export const getTaskSubmissionById =
  async (
    submissionId: string,
    userId: string,
    userRole: string
  ) => {
    validateObjectId(
      submissionId,
      "submission ID"
    );

    validateObjectId(
      userId,
      "user ID"
    );

    const submission =
      await TaskSubmission.findById(
        submissionId
      )
        .populate(
          "task",
          "title type status claimedBy reward configuration"
        )
        .populate(
          "project",
          "title client projectManager status"
        )
        .populate(
          "dataset",
          "name type status"
        )
        .populate(
          "datasetItem",
          "type content metadata status"
        )
        .populate(
          "contributor",
          "name email role"
        );

    if (!submission) {
      throw new ApiError(
        404,
        "Task submission not found"
      );
    }

    // ========================================================
    // ADMIN
    // ========================================================

    if (
      userRole ===
        "SUPER_ADMIN" ||
      userRole ===
        "ADMIN"
    ) {
      return submission;
    }

    // ========================================================
    // CONTRIBUTOR
    // ========================================================

    if (
      userRole ===
      "CONTRIBUTOR"
    ) {
      if (
        submission.contributor._id.toString() !==
        userId
      ) {
        throw new ApiError(
          403,
          "You do not have access to this submission"
        );
      }

      return submission;
    }

    // ========================================================
    // REVIEWER
    // ========================================================

    if (
      userRole ===
      "REVIEWER"
    ) {
      return submission;
    }

    // ========================================================
    // CLIENT
    // ========================================================

    if (
      userRole ===
      "CLIENT"
    ) {
      const project =
        submission.project as unknown as {
          client:
            | mongoose.Types.ObjectId
            | null;
        };

      if (
        project.client?.toString() !==
        userId
      ) {
        throw new ApiError(
          403,
          "You do not have access to this submission"
        );
      }

      return submission;
    }

    // ========================================================
    // PROJECT MANAGER
    // ========================================================

    if (
      userRole ===
      "PROJECT_MANAGER"
    ) {
      const project =
        submission.project as unknown as {
          projectManager:
            | mongoose.Types.ObjectId
            | null;
        };

      if (
        project.projectManager?.toString() !==
        userId
      ) {
        throw new ApiError(
          403,
          "You do not have access to this submission"
        );
      }

      return submission;
    }

    throw new ApiError(
      403,
      "You do not have access to this submission"
    );
  };

// ============================================================
// GET TASK SUBMISSIONS
// ============================================================

export const getTaskSubmissions =
  async (
    userId: string,
    userRole: string,
    filters?: {
      taskId?: string;
      projectId?: string;
      contributorId?: string;
      status?: string;
    }
  ) => {
    validateObjectId(
      userId,
      "user ID"
    );

    const filter: Record<
      string,
      unknown
    > = {};

    // ========================================================
    // FILTERS
    // ========================================================

    if (
      filters?.taskId
    ) {
      validateObjectId(
        filters.taskId,
        "task ID"
      );

      filter.task =
        filters.taskId;
    }

    if (
      filters?.projectId
    ) {
      validateObjectId(
        filters.projectId,
        "project ID"
      );

      filter.project =
        filters.projectId;
    }

    if (
      filters?.contributorId
    ) {
      validateObjectId(
        filters.contributorId,
        "contributor ID"
      );

      filter.contributor =
        filters.contributorId;
    }

    if (
      filters?.status
    ) {
      filter.status =
        filters.status;
    }

    // ========================================================
    // ADMIN
    // ========================================================

    if (
      userRole ===
        "SUPER_ADMIN" ||
      userRole ===
        "ADMIN"
    ) {
      return TaskSubmission.find(
        filter
      )
        .populate(
          "task",
          "title type status claimedBy reward"
        )
        .populate(
          "project",
          "title client projectManager status"
        )
        .populate(
          "contributor",
          "name email role"
        )
        .sort({
          createdAt: -1,
        });
    }

    // ========================================================
    // REVIEWER
    // ========================================================

    if (
      userRole ===
      "REVIEWER"
    ) {
      return TaskSubmission.find(
        filter
      )
        .populate(
          "task",
          "title type status claimedBy reward"
        )
        .populate(
          "project",
          "title client projectManager status"
        )
        .populate(
          "contributor",
          "name email role"
        )
        .sort({
          createdAt: -1,
        });
    }

    // ========================================================
    // CONTRIBUTOR
    // ========================================================

    if (
      userRole ===
      "CONTRIBUTOR"
    ) {
      filter.contributor =
        userId;

      return TaskSubmission.find(
        filter
      )
        .populate(
          "task",
          "title type status claimedBy reward"
        )
        .populate(
          "project",
          "title client projectManager status"
        )
        .populate(
          "contributor",
          "name email role"
        )
        .sort({
          createdAt: -1,
        });
    }

    // ========================================================
    // CLIENT
    // ========================================================

    if (
      userRole ===
      "CLIENT"
    ) {
      const projects =
        await Project.find({
          client:
            userId,
        }).select(
          "_id"
        );

      const projectIds =
        projects.map(
          (project) =>
            project._id
        );

      filter.project = {
        $in:
          projectIds,
      };

      return TaskSubmission.find(
        filter
      )
        .populate(
          "task",
          "title type status claimedBy reward"
        )
        .populate(
          "project",
          "title client projectManager status"
        )
        .populate(
          "contributor",
          "name email role"
        )
        .sort({
          createdAt: -1,
        });
    }

    // ========================================================
    // PROJECT MANAGER
    // ========================================================

    if (
      userRole ===
      "PROJECT_MANAGER"
    ) {
      const projects =
        await Project.find({
          projectManager:
            userId,
        }).select(
          "_id"
        );

      const projectIds =
        projects.map(
          (project) =>
            project._id
        );

      filter.project = {
        $in:
          projectIds,
      };

      return TaskSubmission.find(
        filter
      )
        .populate(
          "task",
          "title type status claimedBy reward"
        )
        .populate(
          "project",
          "title client projectManager status"
        )
        .populate(
          "contributor",
          "name email role"
        )
        .sort({
          createdAt: -1,
        });
    }

    return [];
  };

// ============================================================
// UPDATE TASK SUBMISSION
// ============================================================

export const updateTaskSubmission =
  async (
    submissionId: string,
    contributorId: string,
    input: unknown
  ) => {
    validateObjectId(
      submissionId,
      "submission ID"
    );

    validateObjectId(
      contributorId,
      "contributor ID"
    );

    const data =
      updateTaskSubmissionSchema.parse(
        input
      );

    const submission =
      await TaskSubmission.findById(
        submissionId
      );

    if (!submission) {
      throw new ApiError(
        404,
        "Task submission not found"
      );
    }

    // ========================================================
    // OWNER CHECK
    // ========================================================

    if (
      submission.contributor.toString() !==
      contributorId
    ) {
      throw new ApiError(
        403,
        "You can only update your own submission"
      );
    }

    // ========================================================
    // FIND TASK
    // ========================================================

    const task =
      await Task.findById(
        submission.task
      );

    if (!task) {
      throw new ApiError(
        404,
        "Task not found"
      );
    }

    ensureTaskBelongsToContributor(
      task,
      contributorId
    );

    // ========================================================
    // ASSIGNMENT CHECK
    // ========================================================

    const assignment =
      await getContributorAssignment(
        task.project,
        contributorId
      );

    if (!assignment) {
      throw new ApiError(
        403,
        "You are not assigned to this project"
      );
    }

    // ========================================================
    // ONLY DRAFT / REVISION CAN BE EDITED
    // ========================================================

    if (
      submission.status !==
        "DRAFT" &&
      submission.status !==
        "REVISION"
    ) {
      throw new ApiError(
        400,
        "Only draft or revision submissions can be updated"
      );
    }

    // ========================================================
    // TASK STATUS CHECK
    // ========================================================

    if (
      task.status !==
        "IN_PROGRESS" &&
      task.status !==
        "REVISION"
    ) {
      throw new ApiError(
        400,
        "Task is not currently editable"
      );
    }

    // ========================================================
    // UPDATE RESPONSE
    // ========================================================

    if (
      data.response !==
      undefined
    ) {
      submission.response =
        normalizeResponse(
          data.response,
          submission.response
        );
    }

    // ========================================================
    // UPDATE FEEDBACK
    // ========================================================

    if (
      data.feedback !==
      undefined
    ) {
      submission.feedback =
        data.feedback;
    }

    // ========================================================
    // STATUS IS NOT CLIENT CONTROLLED
    // ========================================================

    await submission.save();

    return submission;
  };

// ============================================================
// SUBMIT TASK SUBMISSION
// ============================================================

export const submitTaskSubmission =
  async (
    submissionId: string,
    contributorId: string,
    input: unknown
  ) => {
    validateObjectId(
      submissionId,
      "submission ID"
    );

    validateObjectId(
      contributorId,
      "contributor ID"
    );

    const data =
      submitTaskSubmissionSchema.parse(
        input
      );

    const submission =
      await TaskSubmission.findById(
        submissionId
      );

    if (!submission) {
      throw new ApiError(
        404,
        "Task submission not found"
      );
    }

    // ========================================================
    // OWNER CHECK
    // ========================================================

    if (
      submission.contributor.toString() !==
      contributorId
    ) {
      throw new ApiError(
        403,
        "You can only submit your own task submission"
      );
    }

    // ========================================================
    // FIND TASK
    // ========================================================

    const task =
      await Task.findById(
        submission.task
      );

    if (!task) {
      throw new ApiError(
        404,
        "Task not found"
      );
    }

    ensureTaskBelongsToContributor(
      task,
      contributorId
    );

    // ========================================================
    // ASSIGNMENT CHECK
    // ========================================================

    const assignment =
      await getContributorAssignment(
        task.project,
        contributorId
      );

    if (!assignment) {
      throw new ApiError(
        403,
        "You are not assigned to this project"
      );
    }

    // ========================================================
    // SUBMISSION STATUS
    // ========================================================

    if (
      submission.status !==
        "DRAFT" &&
      submission.status !==
        "REVISION"
    ) {
      throw new ApiError(
        400,
        "This submission cannot be submitted again"
      );
    }

    // ========================================================
    // TASK STATUS
    // ========================================================

    if (
      task.status !==
        "IN_PROGRESS" &&
      task.status !==
        "REVISION"
    ) {
      throw new ApiError(
        400,
        "Task cannot be submitted in its current status"
      );
    }

    // ========================================================
    // UPDATE RESPONSE
    // ========================================================

    if (
      data.response !==
      undefined
    ) {
      submission.response =
        normalizeResponse(
          data.response,
          submission.response
        );
    }

    // ========================================================
    // UPDATE FEEDBACK
    // ========================================================

    if (
      data.feedback !==
      undefined
    ) {
      submission.feedback =
        data.feedback;
    }

    // ========================================================
    // SERVER CONTROLLED STATUS
    // ========================================================

    submission.status =
      "SUBMITTED";

    submission.submittedAt =
      new Date();

    submission.reviewedAt =
      null;

    submission.revisionRequestedAt =
      null;

    // ========================================================
    // TASK STATUS
    // ========================================================

    task.status =
      "SUBMITTED";

    task.submittedAt =
      new Date();

    // ========================================================
    // REVIEW REQUIRED
    // ========================================================

    if (
      task.configuration
        ?.reviewRequired
    ) {
      task.status =
        "UNDER_REVIEW";

      submission.status =
        "UNDER_REVIEW";
    }

    // ========================================================
    // SAVE
    // ========================================================

    await submission.save();

    await task.save();

    return {
      submission,
      task,
    };
  };

// ============================================================
// MARK SUBMISSION UNDER REVIEW
// ============================================================

export const markSubmissionUnderReview =
  async (
    submissionId: string,
    reviewerId: string
  ) => {
    validateObjectId(
      submissionId,
      "submission ID"
    );

    validateObjectId(
      reviewerId,
      "reviewer ID"
    );

    const submission =
      await TaskSubmission.findById(
        submissionId
      );

    if (!submission) {
      throw new ApiError(
        404,
        "Task submission not found"
      );
    }

    // ========================================================
    // FIND TASK
    // ========================================================

    const task =
      await Task.findById(
        submission.task
      );

    if (!task) {
      throw new ApiError(
        404,
        "Task not found"
      );
    }

    // ========================================================
    // ONLY SUBMITTED / UNDER REVIEW
    // ========================================================

    if (
      submission.status !==
        "SUBMITTED" &&
      submission.status !==
        "UNDER_REVIEW"
    ) {
      throw new ApiError(
        400,
        "Only submitted submissions can be moved to review"
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
        "Task is not ready for review"
      );
    }

    // ========================================================
    // UPDATE SUBMISSION
    // ========================================================

    submission.status =
      "UNDER_REVIEW";

    // ========================================================
    // UPDATE TASK
    // ========================================================

    task.status =
      "UNDER_REVIEW";

    await submission.save();

    await task.save();

    return {
      submission,
      task,
    };
  };