import mongoose from "mongoose";

import Earning from "../models/Earning.js";

import Task from "../models/Task.js";

import TaskSubmission from "../models/TaskSubmission.js";

import Project from "../models/Project.js";

import User from "../models/User.js";

import Wallet from "../models/Wallet.js";

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

  source?:
    | "TASK"
    | "BONUS"
    | "ADJUSTMENT";

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

// ============================================================
// CHECK ADMIN EARNING PERMISSION
// ============================================================

const canManageEarnings = (
  role: UserRole
): boolean => {
  return (
    role === "SUPER_ADMIN" ||
    role === "ADMIN"
  );
};

// ============================================================
// CHECK EARNING VIEW PERMISSION
// ============================================================

const canViewAllEarnings = (
  role: UserRole
): boolean => {
  return (
    role === "SUPER_ADMIN" ||
    role === "ADMIN"
  );
};

// ============================================================
// RECALCULATE CONTRIBUTOR WALLET
// ============================================================
//
// Wallet values are derived from Earning records.
//
// totalEarnings
//   = all non-cancelled earnings
//
// pending
//   = PENDING earnings
//
// available
//   = AVAILABLE earnings
//
// processing
//   = PROCESSING earnings
//
// paid
//   = PAID earnings
//
// FAILED / CANCELLED are not included in the available
// contributor balance.
//
// ============================================================

const recalculateContributorWallet =
  async (
    contributorId: string,
    currency = "INR"
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

    const contributorObjectId =
      new mongoose.Types.ObjectId(
        contributorId
      );

    const result =
      await Earning.aggregate([
        {
          $match: {
            contributor:
              contributorObjectId,

            currency,
          },
        },

        {
          $group: {
            _id: null,

            totalEarnings: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      "$status",
                      [
                        "PENDING",
                        "AVAILABLE",
                        "PROCESSING",
                        "PAID",
                      ],
                    ],
                  },

                  "$amount",

                  0,
                ],
              },
            },

            pending: {
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

            available: {
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

            processing: {
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

            paid: {
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
          },
        },
      ]);

    const summary =
      result[0] ?? {
        totalEarnings: 0,
        pending: 0,
        available: 0,
        processing: 0,
        paid: 0,
      };

    // ========================================================
    // FIND OR CREATE WALLET
    // ========================================================

    let wallet =
      await Wallet.findOne({
        contributor:
          contributorObjectId,
      });

    if (!wallet) {
      wallet =
        await Wallet.create({
          contributor:
            contributorObjectId,

          currency,

          balance: {
            totalEarnings:
              summary.totalEarnings,

            pending:
              summary.pending,

            available:
              summary.available,

            processing:
              summary.processing,

            paid:
              summary.paid,
          },

          status: "ACTIVE",
        });

      return wallet;
    }

    // ========================================================
    // UPDATE WALLET
    // ========================================================

    wallet.currency =
      wallet.currency ??
      currency;

    wallet.balance.totalEarnings =
      summary.totalEarnings;

    wallet.balance.pending =
      summary.pending;

    wallet.balance.available =
      summary.available;

    wallet.balance.processing =
      summary.processing;

    wallet.balance.paid =
      summary.paid;

    await wallet.save();

    return wallet;
  };

// ============================================================
// CREATE EARNING
// ============================================================
//
// This is the normal ADMIN/SUPER_ADMIN earning creation API.
//
// TASK earnings should normally be created automatically by
// createTaskEarningForApprovedSubmission() after a human
// reviewer approves the submission.
//
// ============================================================

export const createEarning =
  async (
    data: CreateEarningInput,
    user: EarningUser
  ) => {
    if (
      !canManageEarnings(
        user.role
      )
    ) {
      throw new ApiError(
        403,
        "You are not allowed to create earnings"
      );
    }

    // ========================================================
    // VALIDATE CONTRIBUTOR
    // ========================================================

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

    // ========================================================
    // VALIDATE PROJECT
    // ========================================================

    if (
      !isValidObjectId(
        data.project
      )
    ) {
      throw new ApiError(
        400,
        "Invalid project ID"
      );
    }

    // ========================================================
    // VALIDATE TASK
    // ========================================================

    if (
      data.task &&
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
    // VALIDATE SUBMISSION
    // ========================================================

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

    // ========================================================
    // FIND CONTRIBUTOR
    // ========================================================

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

    // ========================================================
    // FIND PROJECT
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

    let task = null;

    let submission = null;

    // ========================================================
    // FIND TASK
    // ========================================================

    if (data.task) {
      task =
        await Task.findById(
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

      // ======================================================
      // TASK EARNING REQUIRES APPROVED TASK
      // ======================================================

      if (
        data.source === "TASK" &&
        task.status !==
          "APPROVED"
      ) {
        throw new ApiError(
          400,
          "Task must be approved before task earning is created"
        );
      }
    }

    // ========================================================
    // FIND SUBMISSION
    // ========================================================

    if (
      data.submission
    ) {
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

      // ======================================================
      // SUBMISSION EARNING REQUIRES APPROVED SUBMISSION
      // ======================================================

      if (
        data.source === "TASK" &&
        submission.status !==
          "APPROVED"
      ) {
        throw new ApiError(
          400,
          "Submission must be approved before task earning is created"
        );
      }
    }

    // ========================================================
    // TASK SOURCE REQUIREMENTS
    // ========================================================

    const source =
      data.source ??
      "TASK";

    if (
      source === "TASK"
    ) {
      if (
        !data.task
      ) {
        throw new ApiError(
          400,
          "Task ID is required for task earning"
        );
      }

      if (
        !data.submission
      ) {
        throw new ApiError(
          400,
          "Submission ID is required for task earning"
        );
      }

      if (
        task &&
        submission &&
        task._id.toString() !==
          submission.task.toString()
      ) {
        throw new ApiError(
          400,
          "Task and submission do not match"
        );
      }
    }

    // ========================================================
    // DUPLICATE CHECK
    // ========================================================

    if (
      source === "TASK" &&
      data.task &&
      data.submission
    ) {
      const existingEarning =
        await Earning.findOne({
          task: data.task,

          submission:
            data.submission,

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

    // ========================================================
    // STATUS
    // ========================================================

    const status =
      data.status ??
      "PENDING";

    // ========================================================
    // CREATE EARNING
    // ========================================================

    const earning =
      await Earning.create({
        contributor:
          data.contributor,

        task:
          data.task ?? null,

        submission:
          data.submission ?? null,

        project:
          data.project,

        source,

        amount:
          data.amount,

        currency:
          data.currency ??
          "INR",

        status,

        description:
          data.description ??
          "",

        availableAt:
          data.availableAt
            ? new Date(
                data.availableAt
              )
            : status ===
                "AVAILABLE"
              ? new Date()
              : null,

        paidAt:
          data.paidAt
            ? new Date(
                data.paidAt
              )
            : status ===
                "PAID"
              ? new Date()
              : null,
      });

    // ========================================================
    // UPDATE WALLET
    // ========================================================

    await recalculateContributorWallet(
      data.contributor,
      data.currency ??
        "INR"
    );

    return earning;
  };

// ============================================================
// CREATE TASK EARNING AFTER HUMAN APPROVAL
// ============================================================
//
// IMPORTANT:
//
// This function is NOT exposed directly as an API endpoint.
//
// taskReview.service.ts calls this function only after a human
// reviewer makes the APPROVED decision.
//
// The earning amount comes from:
//     task.reward.amount
//
// The contributor comes from:
//     submission.contributor
//
// The project comes from:
//     task.project
//
// Therefore the client/reviewer cannot manipulate the earning
// amount during approval.
//
// ============================================================

export const createTaskEarningForApprovedSubmission =
  async ({
    taskId,
    submissionId,
  }: {
    taskId: string;

    submissionId: string;
  }) => {
    // ========================================================
    // VALIDATE IDS
    // ========================================================

    if (
      !isValidObjectId(
        taskId
      )
    ) {
      throw new ApiError(
        400,
        "Invalid task ID"
      );
    }

    if (
      !isValidObjectId(
        submissionId
      )
    ) {
      throw new ApiError(
        400,
        "Invalid submission ID"
      );
    }

    // ========================================================
    // FIND TASK
    // ========================================================

    const task =
      await Task.findById(
        taskId
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
        submissionId
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
    // VERIFY PROJECT RELATION
    // ========================================================

    if (
      submission.project.toString() !==
      task.project.toString()
    ) {
      throw new ApiError(
        400,
        "Task and submission project do not match"
      );
    }

    // ========================================================
    // VERIFY APPROVAL
    // ========================================================

    if (
      task.status !==
      "APPROVED"
    ) {
      throw new ApiError(
        400,
        "Task must be approved before earning is created"
      );
    }

    if (
      submission.status !==
      "APPROVED"
    ) {
      throw new ApiError(
        400,
        "Submission must be approved before earning is created"
      );
    }

    // ========================================================
    // VERIFY CONTRIBUTOR
    // ========================================================

    const contributor =
      await User.findById(
        submission.contributor
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
        "Approved task earning can only belong to a contributor"
      );
    }

    // ========================================================
    // DUPLICATE CHECK
    // ========================================================
    //
    // This protects against the same review flow being
    // accidentally executed twice.
    //
    // A database unique index should also be added in
    // Earning.ts for final race-condition protection.
    //
    // ========================================================

    const existingEarning =
      await Earning.findOne({
        contributor:
          submission.contributor,

        task:
          task._id,

        submission:
          submission._id,

        source: "TASK",
      });

    if (existingEarning) {
      // Wallet may have become stale if the previous request
      // created the earning but failed before recalculation.
      //
      // Recalculate it and return the existing earning instead
      // of creating a duplicate.
      await recalculateContributorWallet(
        submission.contributor.toString(),
        task.reward.currency ??
          "INR"
      );

      return existingEarning;
    }

    // ========================================================
    // VERIFY REWARD AMOUNT
    // ========================================================

    const rewardAmount =
      Number(
        task.reward.amount
      );

    if (
      !Number.isFinite(
        rewardAmount
      ) ||
      rewardAmount <= 0
    ) {
      throw new ApiError(
        400,
        "Task reward amount must be greater than zero"
      );
    }

    const currency =
      task.reward.currency ??
      "INR";

    // ========================================================
    // CREATE AUTOMATIC TASK EARNING
    // ========================================================
    //
    // APPROVED task => AVAILABLE earning.
    //
    // This means contributor can see the earning in the
    // available balance immediately.
    //
    // ========================================================

    let earning;

    try {
      earning =
        await Earning.create({
          contributor:
            submission.contributor,

          task:
            task._id,

          submission:
            submission._id,

          project:
            task.project,

          source:
            "TASK",

          amount:
            rewardAmount,

          currency,

          status:
            "AVAILABLE",

          description:
            `Task reward for approved task ${task._id.toString()}`,

          availableAt:
            new Date(),

          paidAt:
            null,
        });
    } catch (error) {
      // ======================================================
      // RACE-CONDITION PROTECTION
      // ======================================================
      //
      // If another request created the same earning between
      // our findOne() and create(), a unique MongoDB index
      // should produce E11000.
      //
      // Fetch the existing earning and return it instead of
      // creating another record.
      // ======================================================

      const mongoError =
        error as {
          code?: number;
        };

      if (
        mongoError.code ===
        11000
      ) {
        const alreadyCreated =
          await Earning.findOne({
            contributor:
              submission.contributor,

            task:
              task._id,

            submission:
              submission._id,

            source: "TASK",
          });

        if (
          alreadyCreated
        ) {
          await recalculateContributorWallet(
            submission.contributor.toString(),
            currency
          );

          return alreadyCreated;
        }
      }

      throw error;
    }

    // ========================================================
    // RECALCULATE WALLET
    // ========================================================

    await recalculateContributorWallet(
      submission.contributor.toString(),
      currency
    );

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
    if (
      !isValidObjectId(
        earningId
      )
    ) {
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
      (
        user.role ===
          "CONTRIBUTOR" &&
        earning.contributor.toString() ===
          user.userId
      );

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

    // ========================================================
    // CONTRIBUTOR ACCESS
    // ========================================================

    if (
      canViewAllEarnings(
        user.role
      )
    ) {
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
    } else if (
      user.role ===
      "CONTRIBUTOR"
    ) {
      query.contributor =
        user.userId;
    } else {
      throw new ApiError(
        403,
        "You are not allowed to view earnings"
      );
    }

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
    // SOURCE FILTER
    // ========================================================

    if (
      filters?.source
    ) {
      query.source =
        filters.source;
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

    return Earning.find(
      query
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
        user.role ===
          "CONTRIBUTOR" &&
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
              $sum: {
                $cond: [
                  {
                    $in: [
                      "$status",
                      [
                        "PENDING",
                        "AVAILABLE",
                        "PROCESSING",
                        "PAID",
                      ],
                    ],
                  },

                  "$amount",

                  0,
                ],
              },
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
    if (
      !canManageEarnings(
        user.role
      )
    ) {
      throw new ApiError(
        403,
        "You are not allowed to update earnings"
      );
    }

    if (
      !isValidObjectId(
        earningId
      )
    ) {
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

    // ========================================================
    // PREVENT MANUAL MODIFICATION OF TASK REWARD SOURCE
    //
    // Once a TASK earning exists, its source/task/submission
    // relationship should remain immutable.
    // ========================================================

    if (
      data.amount !==
      undefined
    ) {
      earning.amount =
        data.amount;
    }

    if (
      data.currency !==
      undefined
    ) {
      earning.currency =
        data.currency;
    }

    if (
      data.source !==
      undefined
    ) {
      if (
        earning.source ===
          "TASK" &&
        data.source !==
          "TASK"
      ) {
        throw new ApiError(
          400,
          "Task earning source cannot be changed"
        );
      }

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
      data.paidAt !==
      undefined
    ) {
      earning.paidAt =
        data.paidAt
          ? new Date(
              data.paidAt
            )
          : null;
    }

    if (
      data.status !==
      undefined
    ) {
      earning.status =
        data.status;

      if (
        data.status ===
          "AVAILABLE" &&
        !earning.availableAt
      ) {
        earning.availableAt =
          new Date();
      }

      if (
        data.status ===
          "PAID" &&
        !earning.paidAt
      ) {
        earning.paidAt =
          new Date();
      }
    }

    await earning.save();

    // ========================================================
    // KEEP WALLET IN SYNC
    // ========================================================

    await recalculateContributorWallet(
      earning.contributor.toString(),
      earning.currency
    );

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
    if (
      !canManageEarnings(
        user.role
      )
    ) {
      throw new ApiError(
        403,
        "You are not allowed to update earning status"
      );
    }

    if (
      !isValidObjectId(
        earningId
      )
    ) {
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

    // ========================================================
    // TASK EARNING STATUS PROTECTION
    // ========================================================
    //
    // Admin can process an earning after approval, but an
    // earning belonging to an approved task must not be
    // manually moved back to an invalid state that breaks
    // the basic earning lifecycle.
    //
    // Allowed lifecycle:
    //
    // AVAILABLE -> PROCESSING -> PAID
    //
    // FAILED / CANCELLED can be used for exceptional cases.
    //
    // ========================================================

    const currentStatus =
      earning.status;

    const allowedTransitions:
      Record<
        string,
        string[]
      > = {
        PENDING: [
          "AVAILABLE",
          "CANCELLED",
          "FAILED",
        ],

        AVAILABLE: [
          "PROCESSING",
          "CANCELLED",
          "FAILED",
        ],

        PROCESSING: [
          "PAID",
          "FAILED",
          "CANCELLED",
        ],

        PAID: [],

        FAILED: [
          "PENDING",
          "AVAILABLE",
        ],

        CANCELLED: [
          "PENDING",
          "AVAILABLE",
        ],
      };

    if (
      currentStatus !==
      status
    ) {
      const allowed =
        allowedTransitions[
          currentStatus
        ] ?? [];

      if (
        !allowed.includes(
          status
        )
      ) {
        throw new ApiError(
          400,
          `Cannot change earning status from ${currentStatus} to ${status}`
        );
      }
    }

    earning.status =
      status;

    if (
      status ===
      "AVAILABLE"
    ) {
      earning.availableAt =
        earning.availableAt ??
        new Date();
    }

    if (
      status ===
      "PAID"
    ) {
      earning.paidAt =
        new Date();
    }

    if (
      status !==
      "PAID"
    ) {
      earning.paidAt =
        null;
    }

    await earning.save();

    // ========================================================
    // KEEP WALLET IN SYNC
    // ========================================================

    await recalculateContributorWallet(
      earning.contributor.toString(),
      earning.currency
    );

    return earning;
  };