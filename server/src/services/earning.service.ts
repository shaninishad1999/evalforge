import mongoose from "mongoose";

import Earning from "../models/Earning.js";
import Task from "../models/Task.js";
import TaskSubmission from "../models/TaskSubmission.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
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

interface EarningUser {
  userId: string;
  role: UserRole;
}

interface CreateEarningInput {
  contributor: string;
  task?: string | null;
  submission?: string | null;
  project: string;
  source?: "TASK" | "BONUS" | "ADJUSTMENT";
  amount: number;
  currency?: string;
  status?:
    | "PENDING"
    | "AVAILABLE"
    | "PROCESSING"
    | "PAID"
    | "FAILED"
    | "CANCELLED";
  description?: string;
  availableAt?: string | null;
  paidAt?: string | null;
}

interface UpdateEarningInput {
  amount?: number;
  currency?: string;
  source?:
    | "TASK"
    | "BONUS"
    | "ADJUSTMENT";
  status?:
    | "PENDING"
    | "AVAILABLE"
    | "PROCESSING"
    | "PAID"
    | "FAILED"
    | "CANCELLED";
  description?: string;
  availableAt?: string | null;
  paidAt?: string | null;
}

// ============================================================
// HELPERS
// ============================================================

const isValidObjectId = (
  id: string
): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

const canManageEarnings = (
  role: UserRole
): boolean => {
  return (
    role === "SUPER_ADMIN" ||
    role === "ADMIN"
  );
};

const canViewAllEarnings = (
  role: UserRole
): boolean => {
  return (
    role === "SUPER_ADMIN" ||
    role === "ADMIN"
  );
};

// ============================================================
// CREATE EARNING
// ============================================================

export const createEarning = async (
  data: CreateEarningInput,
  user: EarningUser
) => {
  if (!canManageEarnings(user.role)) {
    throw new ApiError(
      403,
      "You are not allowed to create earnings"
    );
  }

  if (
    !isValidObjectId(
      data.contributor
    )
  ) {
    throw new ApiError(
      400,
      "Invalid contributor ID"
    );
  }

  if (
    !isValidObjectId(data.project)
  ) {
    throw new ApiError(
      400,
      "Invalid project ID"
    );
  }

  if (
    data.task &&
    !isValidObjectId(data.task)
  ) {
    throw new ApiError(
      400,
      "Invalid task ID"
    );
  }

  if (
    data.submission &&
    !isValidObjectId(
      data.submission
    )
  ) {
    throw new ApiError(
      400,
      "Invalid task submission ID"
    );
  }

  const contributor =
    await User.findById(
      data.contributor
    );

  if (!contributor) {
    throw new ApiError(
      404,
      "Contributor not found"
    );
  }

  if (
    contributor.role !==
    "CONTRIBUTOR"
  ) {
    throw new ApiError(
      400,
      "Earning can only be created for contributors"
    );
  }

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

  let task = null;
  let submission = null;

  if (data.task) {
    task = await Task.findById(
      data.task
    );

    if (!task) {
      throw new ApiError(
        404,
        "Task not found"
      );
    }

    if (
      task.project.toString() !==
      data.project
    ) {
      throw new ApiError(
        400,
        "Task does not belong to the selected project"
      );
    }

    if (
      data.source === "TASK" &&
      task.status !== "APPROVED"
    ) {
      throw new ApiError(
        400,
        "Task must be approved before task earning is created"
      );
    }
  }

  if (data.submission) {
    submission =
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
      submission.project.toString() !==
      data.project
    ) {
      throw new ApiError(
        400,
        "Submission does not belong to the selected project"
      );
    }

    if (
      submission.contributor.toString() !==
      data.contributor
    ) {
      throw new ApiError(
        400,
        "Submission does not belong to the selected contributor"
      );
    }

    if (
      data.source === "TASK" &&
      submission.status !== "APPROVED"
    ) {
      throw new ApiError(
        400,
        "Submission must be approved before task earning is created"
      );
    }
  }

  if (data.source === "TASK") {
    if (!data.task) {
      throw new ApiError(
        400,
        "Task ID is required for task earning"
      );
    }

    if (!data.submission) {
      throw new ApiError(
        400,
        "Submission ID is required for task earning"
      );
    }
  }

  if (
    data.source === "TASK" &&
    data.task &&
    data.submission
  ) {
    const existingEarning =
      await Earning.findOne({
        task: data.task,
        submission: data.submission,
        contributor:
          data.contributor,
        source: "TASK",
      });

    if (existingEarning) {
      throw new ApiError(
        409,
        "Earning already exists for this task submission"
      );
    }
  }

  const status =
    data.status ?? "PENDING";

  const earning =
    await Earning.create({
      contributor:
        data.contributor,
      task: data.task ?? null,
      submission:
        data.submission ?? null,
      project: data.project,
      source:
        data.source ?? "TASK",
      amount: data.amount,
      currency:
        data.currency ?? "INR",
      status,
      description:
        data.description ?? "",
      availableAt:
        data.availableAt
          ? new Date(data.availableAt)
          : status === "AVAILABLE"
            ? new Date()
            : null,
      paidAt:
        data.paidAt
          ? new Date(data.paidAt)
          : status === "PAID"
            ? new Date()
            : null,
    });

  return earning;
};

// ============================================================
// GET EARNING BY ID
// ============================================================

export const getEarningById =
  async (
    earningId: string,
    user: EarningUser
  ) => {
    if (!isValidObjectId(earningId)) {
      throw new ApiError(
        400,
        "Invalid earning ID"
      );
    }

    const earning =
      await Earning.findById(
        earningId
      )
        .populate(
          "contributor",
          "name email role"
        )
        .populate(
          "task",
          "title type status reward"
        )
        .populate(
          "submission"
        )
        .populate(
          "project",
          "title status"
        );

    if (!earning) {
      throw new ApiError(
        404,
        "Earning not found"
      );
    }

    const canView =
      canViewAllEarnings(
        user.role
      ) ||
      earning.contributor.toString() ===
        user.userId;

    if (!canView) {
      throw new ApiError(
        403,
        "You are not allowed to view this earning"
      );
    }

    return earning;
  };

// ============================================================
// GET EARNINGS
// ============================================================

export const getEarnings =
  async (
    user: EarningUser,
    filters?: {
      contributor?: string;
      task?: string;
      submission?: string;
      project?: string;
      source?:
        | "TASK"
        | "BONUS"
        | "ADJUSTMENT";
      status?:
        | "PENDING"
        | "AVAILABLE"
        | "PROCESSING"
        | "PAID"
        | "FAILED"
        | "CANCELLED";
    }
  ) => {
    const query: Record<
      string,
      unknown
    > = {};

    if (
      canViewAllEarnings(
        user.role
      )
    ) {
      if (
        filters?.contributor &&
        isValidObjectId(
          filters.contributor
        )
      ) {
        query.contributor =
          filters.contributor;
      }
    } else if (
      user.role === "CONTRIBUTOR"
    ) {
      query.contributor =
        user.userId;
    } else {
      throw new ApiError(
        403,
        "You are not allowed to view earnings"
      );
    }

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

    if (filters?.source) {
      query.source =
        filters.source;
    }

    if (filters?.status) {
      query.status =
        filters.status;
    }

    return Earning.find(query)
      .populate(
        "contributor",
        "name email role"
      )
      .populate(
        "task",
        "title type status reward"
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
// GET CONTRIBUTOR EARNING SUMMARY
// ============================================================

export const getContributorEarningSummary =
  async (
    contributorId: string,
    user: EarningUser
  ) => {
    if (
      !isValidObjectId(
        contributorId
      )
    ) {
      throw new ApiError(
        400,
        "Invalid contributor ID"
      );
    }

    const canView =
      canViewAllEarnings(
        user.role
      ) ||
      (
        user.role === "CONTRIBUTOR" &&
        user.userId ===
          contributorId
      );

    if (!canView) {
      throw new ApiError(
        403,
        "You are not allowed to view this earning summary"
      );
    }

    const summary =
      await Earning.aggregate([
        {
          $match: {
            contributor:
              new mongoose.Types.ObjectId(
                contributorId
              ),
          },
        },
        {
          $group: {
            _id: null,

            totalEarnings: {
              $sum: "$amount",
            },

            pendingEarnings: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "PENDING",
                    ],
                  },
                  "$amount",
                  0,
                ],
              },
            },

            availableEarnings: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "AVAILABLE",
                    ],
                  },
                  "$amount",
                  0,
                ],
              },
            },

            processingEarnings: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "PROCESSING",
                    ],
                  },
                  "$amount",
                  0,
                ],
              },
            },

            paidEarnings: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "PAID",
                    ],
                  },
                  "$amount",
                  0,
                ],
              },
            },

            failedEarnings: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "FAILED",
                    ],
                  },
                  "$amount",
                  0,
                ],
              },
            },

            cancelledEarnings: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "CANCELLED",
                    ],
                  },
                  "$amount",
                  0,
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalEarnings: 1,
            pendingEarnings: 1,
            availableEarnings: 1,
            processingEarnings: 1,
            paidEarnings: 1,
            failedEarnings: 1,
            cancelledEarnings: 1,
          },
        },
      ]);

    return (
      summary[0] ?? {
        totalEarnings: 0,
        pendingEarnings: 0,
        availableEarnings: 0,
        processingEarnings: 0,
        paidEarnings: 0,
        failedEarnings: 0,
        cancelledEarnings: 0,
      }
    );
  };

// ============================================================
// UPDATE EARNING
// ============================================================

export const updateEarning =
  async (
    earningId: string,
    data: UpdateEarningInput,
    user: EarningUser
  ) => {
    if (!canManageEarnings(user.role)) {
      throw new ApiError(
        403,
        "You are not allowed to update earnings"
      );
    }

    if (!isValidObjectId(earningId)) {
      throw new ApiError(
        400,
        "Invalid earning ID"
      );
    }

    const earning =
      await Earning.findById(
        earningId
      );

    if (!earning) {
      throw new ApiError(
        404,
        "Earning not found"
      );
    }

    if (
      data.amount !== undefined
    ) {
      earning.amount =
        data.amount;
    }

    if (
      data.currency !== undefined
    ) {
      earning.currency =
        data.currency;
    }

    if (
      data.source !== undefined
    ) {
      earning.source =
        data.source;
    }

    if (
      data.description !==
      undefined
    ) {
      earning.description =
        data.description;
    }

    if (
      data.availableAt !==
      undefined
    ) {
      earning.availableAt =
        data.availableAt
          ? new Date(
              data.availableAt
            )
          : null;
    }

    if (
      data.paidAt !== undefined
    ) {
      earning.paidAt =
        data.paidAt
          ? new Date(data.paidAt)
          : null;
    }

    if (
      data.status !== undefined
    ) {
      earning.status =
        data.status;

      if (
        data.status === "AVAILABLE" &&
        !earning.availableAt
      ) {
        earning.availableAt =
          new Date();
      }

      if (
        data.status === "PAID" &&
        !earning.paidAt
      ) {
        earning.paidAt =
          new Date();
      }
    }

    await earning.save();

    return earning;
  };

// ============================================================
// UPDATE EARNING STATUS
// ============================================================

export const updateEarningStatus =
  async (
    earningId: string,
    status:
      | "PENDING"
      | "AVAILABLE"
      | "PROCESSING"
      | "PAID"
      | "FAILED"
      | "CANCELLED",
    user: EarningUser
  ) => {
    if (!canManageEarnings(user.role)) {
      throw new ApiError(
        403,
        "You are not allowed to update earning status"
      );
    }

    if (!isValidObjectId(earningId)) {
      throw new ApiError(
        400,
        "Invalid earning ID"
      );
    }

    const earning =
      await Earning.findById(
        earningId
      );

    if (!earning) {
      throw new ApiError(
        404,
        "Earning not found"
      );
    }

    earning.status =
      status;

    if (
      status === "AVAILABLE" &&
      !earning.availableAt
    ) {
      earning.availableAt =
        new Date();
    }

    if (
      status === "PAID"
    ) {
      earning.paidAt =
        new Date();
    }

    if (
      status !== "PAID"
    ) {
      earning.paidAt =
        null;
    }

    await earning.save();

    return earning;
  };