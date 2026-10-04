import mongoose from "mongoose";

import TaskSubmission from "../models/TaskSubmission.js";
import Task from "../models/Task.js";
import Project from "../models/Project.js";
import Dataset from "../models/Dataset.js";
import DatasetItem from "../models/DatasetItem.js";
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
) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(
      400,
      `Invalid ${fieldName}`
    );
  }
};

// ============================================================
// CREATE TASK SUBMISSION
// ============================================================

export const createTaskSubmission = async (
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

  // ==========================================================
  // FIND TASK
  // ==========================================================

  const task =
    await Task.findById(data.task);

  if (!task) {
    throw new ApiError(
      404,
      "Task not found"
    );
  }

  // ==========================================================
  // VERIFY TASK PROJECT
  // ==========================================================

  if (
    task.project.toString() !==
    data.project
  ) {
    throw new ApiError(
      400,
      "Task does not belong to this project"
    );
  }

  // ==========================================================
  // VERIFY TASK DATASET
  // ==========================================================

  if (
    task.dataset.toString() !==
    data.dataset
  ) {
    throw new ApiError(
      400,
      "Task does not belong to this dataset"
    );
  }

  // ==========================================================
  // VERIFY TASK DATASET ITEM
  // ==========================================================

  if (
    task.datasetItem.toString() !==
    data.datasetItem
  ) {
    throw new ApiError(
      400,
      "Task does not belong to this dataset item"
    );
  }

  // ==========================================================
  // VERIFY CONTRIBUTOR OWNS TASK
  // ==========================================================

  if (
    task.claimedBy?.toString() !==
    contributorId
  ) {
    throw new ApiError(
      403,
      "This task is not assigned to you"
    );
  }

  // ==========================================================
  // VERIFY TASK STATUS
  // ==========================================================

  if (
    task.status !== "IN_PROGRESS" &&
    task.status !== "REVISION"
  ) {
    throw new ApiError(
      400,
      "This task is not ready for submission"
    );
  }

  // ==========================================================
  // FIND PROJECT
  // ==========================================================

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

  // ==========================================================
  // FIND DATASET
  // ==========================================================

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

  // ==========================================================
  // FIND DATASET ITEM
  // ==========================================================

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

  // ==========================================================
  // VERIFY ATTEMPT NUMBER
  // ==========================================================

  if (
    data.attemptNumber >
    task.configuration.maxAttempts
  ) {
    throw new ApiError(
      400,
      `Maximum ${task.configuration.maxAttempts} attempts are allowed for this task`
    );
  }

  // ==========================================================
  // CHECK EXISTING ATTEMPT
  // ==========================================================

  const existingSubmission =
    await TaskSubmission.findOne({
      task: task._id,
      contributor: contributorId,
      attemptNumber:
        data.attemptNumber,
    });

  if (existingSubmission) {
    throw new ApiError(
      409,
      "This attempt already exists"
    );
  }

  // ==========================================================
  // CREATE SUBMISSION
  // ==========================================================

  const submission =
    await TaskSubmission.create({
      task: task._id,

      project: project._id,

      dataset: dataset._id,

      datasetItem: datasetItem._id,

      contributor:
        new mongoose.Types.ObjectId(
          contributorId
        ),

      attemptNumber:
        data.attemptNumber,

      response: {
        answer:
          data.response.answer ?? "",

        selectedLabel:
          data.response.selectedLabel ??
          "",

        ranking:
          data.response.ranking ?? [],

        rewrittenText:
          data.response.rewrittenText ??
          "",

        transcription:
          data.response.transcription ??
          "",

        code:
          data.response.code ?? "",

        boundingBoxes:
          data.response.boundingBoxes ??
          [],

        evaluation: {
          score:
            data.response.evaluation
              ?.score ?? null,

          criteria:
            data.response.evaluation
              ?.criteria ?? [],
        },
      },

      feedback:
        data.feedback ?? "",

      status:
        data.status ?? "DRAFT",

      submittedAt:
        data.status === "SUBMITTED"
          ? new Date()
          : null,

      reviewedAt: null,

      revisionRequestedAt: null,
    });

  return submission;
};

// ============================================================
// GET SUBMISSION BY ID
// ============================================================

export const getTaskSubmissionById =
  async (
    submissionId: string,
    userId?: string,
    userRole?: string
  ) => {
    validateObjectId(
      submissionId,
      "task submission ID"
    );

    const submission =
      await TaskSubmission.findById(
        submissionId
      )
        .populate(
          "task",
          "title type instructions prompt evaluationCriteria configuration reward status claimedBy"
        )
        .populate(
          "project",
          "title description client projectManager status"
        )
        .populate(
          "dataset",
          "name description type status"
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
      userRole === "SUPER_ADMIN" ||
      userRole === "ADMIN"
    ) {
      return submission;
    }

    // ========================================================
    // CONTRIBUTOR
    // ========================================================

    if (
      userRole === "CONTRIBUTOR" &&
      submission.contributor
        .toString() === userId
    ) {
      return submission;
    }

    // ========================================================
    // REVIEWER
    // ========================================================

    if (
      userRole === "REVIEWER"
    ) {
      return submission;
    }

    // ========================================================
    // CLIENT / PROJECT MANAGER
    // ========================================================

    const project =
      submission.project as unknown as {
        client?:
          | mongoose.Types.ObjectId;
        projectManager?:
          | mongoose.Types.ObjectId
          | null;
      };

    if (userId && userRole) {
      const isClient =
        userRole === "CLIENT" &&
        project.client?.toString() ===
          userId;

      const isProjectManager =
        userRole ===
          "PROJECT_MANAGER" &&
        project.projectManager
          ?.toString() === userId;

      if (
        isClient ||
        isProjectManager
      ) {
        return submission;
      }
    }

    throw new ApiError(
      403,
      "You do not have access to this task submission"
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
    // TASK FILTER
    // ========================================================

    if (filters?.taskId) {
      validateObjectId(
        filters.taskId,
        "task ID"
      );

      filter.task =
        filters.taskId;
    }

    // ========================================================
    // STATUS FILTER
    // ========================================================

    if (filters?.status) {
      filter.status =
        filters.status;
    }

    // ========================================================
    // ADMIN
    // ========================================================

    if (
      userRole === "SUPER_ADMIN" ||
      userRole === "ADMIN"
    ) {
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

      return TaskSubmission.find(
        filter
      )
        .populate(
          "task",
          "title type status reward"
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
        )
        .sort({
          createdAt: -1,
        });
    }

    // ========================================================
    // CONTRIBUTOR
    // ========================================================

    if (
      userRole === "CONTRIBUTOR"
    ) {
      filter.contributor =
        userId;

      return TaskSubmission.find(
        filter
      )
        .populate(
          "task",
          "title type status reward"
        )
        .populate(
          "project",
          "title description status"
        )
        .populate(
          "dataset",
          "name type status"
        )
        .populate(
          "datasetItem",
          "type content metadata status"
        )
        .sort({
          createdAt: -1,
        });
    }

    // ========================================================
    // REVIEWER
    // ========================================================

    if (
      userRole === "REVIEWER"
    ) {
      return TaskSubmission.find(
        filter
      )
        .populate(
          "task",
          "title type status reward"
        )
        .populate(
          "project",
          "title description status"
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
        )
        .sort({
          createdAt: -1,
        });
    }

    // ========================================================
    // CLIENT
    // ========================================================

    if (
      userRole === "CLIENT"
    ) {
      const projects =
        await Project.find({
          client: userId,
        }).select("_id");

      const projectIds =
        projects.map(
          (project) => project._id
        );

      filter.project = {
        $in: projectIds,
      };

      return TaskSubmission.find(
        filter
      )
        .populate(
          "task",
          "title type status reward"
        )
        .populate(
          "project",
          "title description status"
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
          projectManager: userId,
        }).select("_id");

      const projectIds =
        projects.map(
          (project) => project._id
        );

      filter.project = {
        $in: projectIds,
      };

      return TaskSubmission.find(
        filter
      )
        .populate(
          "task",
          "title type status reward"
        )
        .populate(
          "project",
          "title description status"
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
      "task submission ID"
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
    // VERIFY OWNER
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
        "This submission cannot be edited"
      );
    }

    // ========================================================
    // UPDATE RESPONSE
    // ========================================================

    if (data.response) {
      submission.response = {
        answer:
          data.response.answer ??
          submission.response.answer,

        selectedLabel:
          data.response.selectedLabel ??
          submission.response
            .selectedLabel,

        ranking:
          data.response.ranking ??
          submission.response.ranking,

        rewrittenText:
          data.response
            .rewrittenText ??
          submission.response
            .rewrittenText,

        transcription:
          data.response
            .transcription ??
          submission.response
            .transcription,

        code:
          data.response.code ??
          submission.response.code,

        boundingBoxes:
          data.response
            .boundingBoxes ??
          submission.response
            .boundingBoxes,

        evaluation: {
          score:
            data.response
              .evaluation?.score ??
            submission.response
              .evaluation.score,

         criteria:
  data.response.evaluation?.criteria
    ? data.response.evaluation.criteria.map(
        (criterion) => ({
          criterion: criterion.criterion,
          score: criterion.score,
          feedback:
            criterion.feedback ?? "",
        })
      )
    : submission.response
        .evaluation.criteria,
        },
      };
    }

    // ========================================================
    // UPDATE FEEDBACK
    // ========================================================

    if (
      data.feedback !== undefined
    ) {
      submission.feedback =
        data.feedback;
    }

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
      "task submission ID"
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
    // VERIFY OWNER
    // ========================================================

    if (
      submission.contributor.toString() !==
      contributorId
    ) {
      throw new ApiError(
        403,
        "You can only submit your own submission"
      );
    }

    // ========================================================
    // GET TASK
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
    // VERIFY TASK OWNER
    // ========================================================

    if (
      task.claimedBy?.toString() !==
      contributorId
    ) {
      throw new ApiError(
        403,
        "This task is not assigned to you"
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
        "This task cannot be submitted"
      );
    }

    // ========================================================
    // UPDATE RESPONSE
    // ========================================================

    submission.response = {
      answer:
        data.response.answer ??
        submission.response.answer,

      selectedLabel:
        data.response.selectedLabel ??
        submission.response
          .selectedLabel,

      ranking:
        data.response.ranking ??
        submission.response.ranking,

      rewrittenText:
        data.response.rewrittenText ??
        submission.response
          .rewrittenText,

      transcription:
        data.response.transcription ??
        submission.response
          .transcription,

      code:
        data.response.code ??
        submission.response.code,

      boundingBoxes:
        data.response.boundingBoxes ??
        submission.response
          .boundingBoxes,

      evaluation: {
        score:
          data.response.evaluation
            ?.score ??
          submission.response
            .evaluation.score,

      criteria:
  data.response.evaluation?.criteria
    ? data.response.evaluation.criteria.map(
        (criterion) => ({
          criterion: criterion.criterion,
          score: criterion.score,
          feedback:
            criterion.feedback ?? "",
        })
      )
    : submission.response
        .evaluation.criteria,
      },
    };

    if (
      data.feedback !== undefined
    ) {
      submission.feedback =
        data.feedback;
    }

    // ========================================================
    // UPDATE SUBMISSION STATUS
    // ========================================================

    submission.status =
      "SUBMITTED";

    submission.submittedAt =
      new Date();

    submission.reviewedAt = null;

    submission.revisionRequestedAt =
      null;

    // ========================================================
    // UPDATE TASK STATUS
    // ========================================================

    task.status =
      "SUBMITTED";

    task.submittedAt =
      new Date();

    if (
      task.configuration
        .reviewRequired
    ) {
      task.status =
        "UNDER_REVIEW";
    }

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
    submissionId: string
  ) => {
    validateObjectId(
      submissionId,
      "task submission ID"
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

    if (
      submission.status !==
      "SUBMITTED"
    ) {
      throw new ApiError(
        400,
        "Only submitted submissions can be moved to review"
      );
    }

    submission.status =
      "UNDER_REVIEW";

    await submission.save();

    return submission;
  };