import mongoose from "mongoose";

import User from "../models/User.js";
import Project from "../models/Project.js";
import ProjectAssignment from "../models/ProjectAssignment.js";
import Task from "../models/Task.js";
import TaskSubmission from "../models/TaskSubmission.js";
import TaskReview from "../models/TaskReview.js";
import Earning from "../models/Earning.js";
import Wallet from "../models/Wallet.js";
import Withdrawal from "../models/Withdrawal.js";
import Payment from "../models/Payment.js";

import { UserRole } from "../models/User.js";
import ApiError from "../utils/ApiError.js";

// ============================================================
// TYPES
// ============================================================

interface DashboardUser {
  userId: string;
  role: UserRole;
}

interface DashboardOptions {
  recentLimit: number;
}

// ============================================================
// OBJECT ID VALIDATION
// ============================================================

const validateObjectId = (
  value: string,
  fieldName = "ID"
): mongoose.Types.ObjectId => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }

  return new mongoose.Types.ObjectId(value);
};

// ============================================================
// COMMON ADMIN DASHBOARD
// ============================================================

const getAdminDashboard = async (
  options: DashboardOptions
) => {
  const [
    totalUsers,
    totalContributors,
    totalClients,
    totalProjectManagers,
    totalReviewers,
    activeUsers,
    totalProjects,
    activeProjects,
    publishedProjects,
    completedProjects,
    totalTasks,
    availableTasks,
    inProgressTasks,
    submittedTasks,
    pendingReviewTasks,
    approvedTasks,
    rejectedTasks,
    revisionTasks,
    totalSubmissions,
    totalReviews,
    pendingReviews,
    totalEarnings,
    availableEarnings,
    pendingEarnings,
    totalWithdrawals,
    pendingWithdrawals,
    processingWithdrawals,
    totalPayments,
    successfulPayments,
  ] = await Promise.all([
    User.countDocuments(),

    User.countDocuments({
      role: "CONTRIBUTOR",
    }),

    User.countDocuments({
      role: "CLIENT",
    }),

    User.countDocuments({
      role: "PROJECT_MANAGER",
    }),

    User.countDocuments({
      role: "REVIEWER",
    }),

    User.countDocuments({
      isActive: true,
    }),

    Project.countDocuments(),

    Project.countDocuments({
      status: "ACTIVE",
    }),

    Project.countDocuments({
      status: "PUBLISHED",
    }),

    Project.countDocuments({
      status: "COMPLETED",
    }),

    Task.countDocuments(),

    Task.countDocuments({
      status: "AVAILABLE",
    }),

    Task.countDocuments({
      status: "IN_PROGRESS",
    }),

    Task.countDocuments({
      status: "SUBMITTED",
    }),

    Task.countDocuments({
      status: "UNDER_REVIEW",
    }),

    Task.countDocuments({
      status: "APPROVED",
    }),

    Task.countDocuments({
      status: "REJECTED",
    }),

    Task.countDocuments({
      status: "REVISION",
    }),

    TaskSubmission.countDocuments(),

    TaskReview.countDocuments(),

    TaskReview.countDocuments({
      status: "PENDING",
    }),

    Earning.aggregate([
      {
        $match: {
          status: {
            $nin: ["CANCELLED", "FAILED"],
          },
        },
      },
      {
        $group: {
          _id: null,
          amount: {
            $sum: "$amount",
          },
        },
      },
    ]),

    Earning.aggregate([
      {
        $match: {
          status: "AVAILABLE",
        },
      },
      {
        $group: {
          _id: null,
          amount: {
            $sum: "$amount",
          },
        },
      },
    ]),

    Earning.aggregate([
      {
        $match: {
          status: "PENDING",
        },
      },
      {
        $group: {
          _id: null,
          amount: {
            $sum: "$amount",
          },
        },
      },
    ]),

    Withdrawal.countDocuments(),

    Withdrawal.countDocuments({
      status: "PENDING",
    }),

    Withdrawal.countDocuments({
      status: "PROCESSING",
    }),

    Payment.countDocuments(),

    Payment.countDocuments({
      status: "SUCCESS",
    }),
  ]);

  const recentProjects = await Project.find()
    .sort({ createdAt: -1 })
    .limit(options.recentLimit)
    .select(
      "_id title status client projectManager createdAt updatedAt"
    )
    .lean();

  const recentTasks = await Task.find()
    .sort({ createdAt: -1 })
    .limit(options.recentLimit)
    .select(
      "_id title type status project claimedBy reward createdAt updatedAt"
    )
    .lean();

  const recentWithdrawals = await Withdrawal.find()
    .sort({ requestedAt: -1 })
    .limit(options.recentLimit)
    .select(
      "_id contributor amount currency method status requestedAt processedAt"
    )
    .lean();

  return {
    role: "ADMIN",

    users: {
      total: totalUsers,
      contributors: totalContributors,
      clients: totalClients,
      projectManagers: totalProjectManagers,
      reviewers: totalReviewers,
      active: activeUsers,
    },

    projects: {
      total: totalProjects,
      active: activeProjects,
      published: publishedProjects,
      completed: completedProjects,
    },

    tasks: {
      total: totalTasks,
      available: availableTasks,
      inProgress: inProgressTasks,
      submitted: submittedTasks,
      pendingReview: pendingReviewTasks,
      approved: approvedTasks,
      rejected: rejectedTasks,
      revision: revisionTasks,
    },

    submissions: {
      total: totalSubmissions,
    },

    reviews: {
      total: totalReviews,
      pending: pendingReviews,
    },

    earnings: {
      total: totalEarnings[0]?.amount ?? 0,
      available: availableEarnings[0]?.amount ?? 0,
      pending: pendingEarnings[0]?.amount ?? 0,
    },

    withdrawals: {
      total: totalWithdrawals,
      pending: pendingWithdrawals,
      processing: processingWithdrawals,
    },

    payments: {
      total: totalPayments,
      successful: successfulPayments,
    },

    recent: {
      projects: recentProjects,
      tasks: recentTasks,
      withdrawals: recentWithdrawals,
    },
  };
};

// ============================================================
// CLIENT DASHBOARD
// ============================================================

const getClientDashboard = async (
  userId: string,
  options: DashboardOptions
) => {
  const clientId = validateObjectId(userId, "user ID");

  const projects = await Project.find({
    client: clientId,
  })
    .select("_id title status projectManager createdAt updatedAt")
    .sort({ createdAt: -1 })
    .lean();

  const projectIds = projects.map(
    (project) => project._id
  );

  const [
    totalProjects,
    activeProjects,
    completedProjects,
    totalTasks,
    availableTasks,
    inProgressTasks,
    submittedTasks,
    pendingReviewTasks,
    approvedTasks,
    rejectedTasks,
    revisionTasks,
  ] = await Promise.all([
    Project.countDocuments({
      client: clientId,
    }),

    Project.countDocuments({
      client: clientId,
      status: "ACTIVE",
    }),

    Project.countDocuments({
      client: clientId,
      status: "COMPLETED",
    }),

    Task.countDocuments({
      project: {
        $in: projectIds,
      },
    }),

    Task.countDocuments({
      project: {
        $in: projectIds,
      },
      status: "AVAILABLE",
    }),

    Task.countDocuments({
      project: {
        $in: projectIds,
      },
      status: "IN_PROGRESS",
    }),

    Task.countDocuments({
      project: {
        $in: projectIds,
      },
      status: "SUBMITTED",
    }),

    Task.countDocuments({
      project: {
        $in: projectIds,
      },
      status: "UNDER_REVIEW",
    }),

    Task.countDocuments({
      project: {
        $in: projectIds,
      },
      status: "APPROVED",
    }),

    Task.countDocuments({
      project: {
        $in: projectIds,
      },
      status: "REJECTED",
    }),

    Task.countDocuments({
      project: {
        $in: projectIds,
      },
      status: "REVISION",
    }),
  ]);

  const totalRewardResult = await Task.aggregate([
    {
      $match: {
        project: {
          $in: projectIds,
        },
        status: "APPROVED",
      },
    },
    {
      $group: {
        _id: null,
        amount: {
          $sum: "$reward.amount",
        },
      },
    },
  ]);

  return {
    role: "CLIENT",

    projects: {
      total: totalProjects,
      active: activeProjects,
      completed: completedProjects,
    },

    tasks: {
      total: totalTasks,
      available: availableTasks,
      inProgress: inProgressTasks,
      submitted: submittedTasks,
      pendingReview: pendingReviewTasks,
      approved: approvedTasks,
      rejected: rejectedTasks,
      revision: revisionTasks,
    },

    approvedTaskRewardValue:
      totalRewardResult[0]?.amount ?? 0,

    recentProjects: projects.slice(
      0,
      options.recentLimit
    ),
  };
};

// ============================================================
// PROJECT MANAGER DASHBOARD
// ============================================================

const getProjectManagerDashboard = async (
  userId: string,
  options: DashboardOptions
) => {
  const managerId = validateObjectId(
    userId,
    "user ID"
  );

  const projects = await Project.find({
    projectManager: managerId,
  })
    .select(
      "_id title status client projectManager createdAt updatedAt"
    )
    .sort({ createdAt: -1 })
    .lean();

  const projectIds = projects.map(
    (project) => project._id
  );

  const [
    totalProjects,
    activeProjects,
    pausedProjects,
    completedProjects,
    totalTasks,
    availableTasks,
    claimedTasks,
    inProgressTasks,
    submittedTasks,
    pendingReviewTasks,
    approvedTasks,
    rejectedTasks,
    revisionTasks,
    totalAssignments,
    activeAssignments,
  ] = await Promise.all([
    Project.countDocuments({
      projectManager: managerId,
    }),

    Project.countDocuments({
      projectManager: managerId,
      status: "ACTIVE",
    }),

    Project.countDocuments({
      projectManager: managerId,
      status: "PAUSED",
    }),

    Project.countDocuments({
      projectManager: managerId,
      status: "COMPLETED",
    }),

    Task.countDocuments({
      project: {
        $in: projectIds,
      },
    }),

    Task.countDocuments({
      project: {
        $in: projectIds,
      },
      status: "AVAILABLE",
    }),

    Task.countDocuments({
      project: {
        $in: projectIds,
      },
      status: "CLAIMED",
    }),

    Task.countDocuments({
      project: {
        $in: projectIds,
      },
      status: "IN_PROGRESS",
    }),

    Task.countDocuments({
      project: {
        $in: projectIds,
      },
      status: "SUBMITTED",
    }),

    Task.countDocuments({
      project: {
        $in: projectIds,
      },
      status: "UNDER_REVIEW",
    }),

    Task.countDocuments({
      project: {
        $in: projectIds,
      },
      status: "APPROVED",
    }),

    Task.countDocuments({
      project: {
        $in: projectIds,
      },
      status: "REJECTED",
    }),

    Task.countDocuments({
      project: {
        $in: projectIds,
      },
      status: "REVISION",
    }),

    ProjectAssignment.countDocuments({
      project: {
        $in: projectIds,
      },
    }),

    ProjectAssignment.countDocuments({
      project: {
        $in: projectIds,
      },
      status: "ACTIVE",
    }),
  ]);

  return {
    role: "PROJECT_MANAGER",

    projects: {
      total: totalProjects,
      active: activeProjects,
      paused: pausedProjects,
      completed: completedProjects,
    },

    tasks: {
      total: totalTasks,
      available: availableTasks,
      claimed: claimedTasks,
      inProgress: inProgressTasks,
      submitted: submittedTasks,
      pendingReview: pendingReviewTasks,
      approved: approvedTasks,
      rejected: rejectedTasks,
      revision: revisionTasks,
    },

    contributors: {
      totalAssignments,
      activeAssignments,
    },

    recentProjects: projects.slice(
      0,
      options.recentLimit
    ),
  };
};

// ============================================================
// REVIEWER DASHBOARD
// ============================================================

const getReviewerDashboard = async (
  userId: string,
  options: DashboardOptions
) => {
  const reviewerId = validateObjectId(
    userId,
    "user ID"
  );

  const [
    totalReviews,
    pendingReviews,
    completedReviews,
    approvedReviews,
    rejectedReviews,
    revisionReviews,
  ] = await Promise.all([
    TaskReview.countDocuments({
      reviewer: reviewerId,
    }),

    TaskReview.countDocuments({
      reviewer: reviewerId,
      status: "PENDING",
    }),

    TaskReview.countDocuments({
      reviewer: reviewerId,
      status: "COMPLETED",
    }),

    TaskReview.countDocuments({
      reviewer: reviewerId,
      decision: "APPROVED",
    }),

    TaskReview.countDocuments({
      reviewer: reviewerId,
      decision: "REJECTED",
    }),

    TaskReview.countDocuments({
      reviewer: reviewerId,
      decision: "REVISION",
    }),
  ]);

  const recentReviews = await TaskReview.find({
    reviewer: reviewerId,
  })
    .sort({ createdAt: -1 })
    .limit(options.recentLimit)
    .select(
      "_id task submission project contributor decision score status reviewedAt createdAt"
    )
    .lean();

  return {
    role: "REVIEWER",

    reviews: {
      total: totalReviews,
      pending: pendingReviews,
      completed: completedReviews,
      approved: approvedReviews,
      rejected: rejectedReviews,
      revision: revisionReviews,
    },

    recentReviews,
  };
};

// ============================================================
// CONTRIBUTOR DASHBOARD
// ============================================================

const getContributorDashboard = async (
  userId: string,
  options: DashboardOptions
) => {
  const contributorId = validateObjectId(
    userId,
    "user ID"
  );

  const assignments = await ProjectAssignment.find({
    contributor: contributorId,
    status: {
      $in: ["PENDING", "ACTIVE", "PAUSED"],
    },
  })
    .select(
      "_id project qualification status assignedAt startedAt"
    )
    .sort({ assignedAt: -1 })
    .limit(options.recentLimit)
    .lean();

  const assignedProjectIds =
    assignments.map(
      (assignment) => assignment.project
    );

  const [
    totalAssignments,
    activeAssignments,
    availableTasks,
    claimedTasks,
    myInProgressTasks,
    mySubmittedTasks,
    myUnderReviewTasks,
    myApprovedTasks,
    myRejectedTasks,
    myRevisionTasks,
    totalSubmissions,
    approvedSubmissions,
    rejectedSubmissions,
    revisionSubmissions,
  ] = await Promise.all([
    ProjectAssignment.countDocuments({
      contributor: contributorId,
    }),

    ProjectAssignment.countDocuments({
      contributor: contributorId,
      status: "ACTIVE",
    }),

    Task.countDocuments({
      project: {
        $in: assignedProjectIds,
      },
      status: "AVAILABLE",
    }),

    Task.countDocuments({
      claimedBy: contributorId,
      status: "CLAIMED",
    }),

    Task.countDocuments({
      claimedBy: contributorId,
      status: "IN_PROGRESS",
    }),

    Task.countDocuments({
      claimedBy: contributorId,
      status: "SUBMITTED",
    }),

    Task.countDocuments({
      claimedBy: contributorId,
      status: "UNDER_REVIEW",
    }),

    Task.countDocuments({
      claimedBy: contributorId,
      status: "APPROVED",
    }),

    Task.countDocuments({
      claimedBy: contributorId,
      status: "REJECTED",
    }),

    Task.countDocuments({
      claimedBy: contributorId,
      status: "REVISION",
    }),

    TaskSubmission.countDocuments({
      contributor: contributorId,
    }),

    TaskSubmission.countDocuments({
      contributor: contributorId,
      status: "APPROVED",
    }),

    TaskSubmission.countDocuments({
      contributor: contributorId,
      status: "REJECTED",
    }),

    TaskSubmission.countDocuments({
      contributor: contributorId,
      status: "REVISION",
    }),
  ]);

  const [
    totalEarnings,
    pendingEarnings,
    availableEarnings,
    processingEarnings,
    paidEarnings,
  ] = await Promise.all([
    Earning.aggregate([
      {
        $match: {
          contributor: contributorId,
          status: {
            $nin: ["CANCELLED", "FAILED"],
          },
        },
      },
      {
        $group: {
          _id: null,
          amount: {
            $sum: "$amount",
          },
        },
      },
    ]),

    Earning.aggregate([
      {
        $match: {
          contributor: contributorId,
          status: "PENDING",
        },
      },
      {
        $group: {
          _id: null,
          amount: {
            $sum: "$amount",
          },
        },
      },
    ]),

    Earning.aggregate([
      {
        $match: {
          contributor: contributorId,
          status: "AVAILABLE",
        },
      },
      {
        $group: {
          _id: null,
          amount: {
            $sum: "$amount",
          },
        },
      },
    ]),

    Earning.aggregate([
      {
        $match: {
          contributor: contributorId,
          status: "PROCESSING",
        },
      },
      {
        $group: {
          _id: null,
          amount: {
            $sum: "$amount",
          },
        },
      },
    ]),

    Earning.aggregate([
      {
        $match: {
          contributor: contributorId,
          status: "PAID",
        },
      },
      {
        $group: {
          _id: null,
          amount: {
            $sum: "$amount",
          },
        },
      },
    ]),
  ]);

  const wallet = await Wallet.findOne({
    contributor: contributorId,
  })
    .select(
      "currency balance status createdAt updatedAt"
    )
    .lean();

  const withdrawalStats = await Withdrawal.aggregate([
    {
      $match: {
        contributor: contributorId,
      },
    },
    {
      $group: {
        _id: "$status",
        count: {
          $sum: 1,
        },
        amount: {
          $sum: "$amount",
        },
      },
    },
  ]);

  const recentTasks = await Task.find({
    claimedBy: contributorId,
  })
    .sort({ updatedAt: -1 })
    .limit(options.recentLimit)
    .select(
      "_id project dataset datasetItem type title status claimedAt startedAt submittedAt reviewedAt reward createdAt updatedAt"
    )
    .lean();

  return {
    role: "CONTRIBUTOR",

    projects: {
      totalAssignments,
      activeAssignments,
      recentAssignments: assignments,
    },

    tasks: {
      available: availableTasks,
      claimed: claimedTasks,
      inProgress: myInProgressTasks,
      submitted: mySubmittedTasks,
      underReview: myUnderReviewTasks,
      approved: myApprovedTasks,
      rejected: myRejectedTasks,
      revision: myRevisionTasks,
    },

    submissions: {
      total: totalSubmissions,
      approved: approvedSubmissions,
      rejected: rejectedSubmissions,
      revision: revisionSubmissions,
    },

    earnings: {
      total: totalEarnings[0]?.amount ?? 0,
      pending: pendingEarnings[0]?.amount ?? 0,
      available: availableEarnings[0]?.amount ?? 0,
      processing: processingEarnings[0]?.amount ?? 0,
      paid: paidEarnings[0]?.amount ?? 0,
    },

    wallet,

    withdrawals: withdrawalStats,

    recentTasks,
  };
};

// ============================================================
// MAIN DASHBOARD SERVICE
// ============================================================

export const getDashboard = async (
  user: DashboardUser,
  options: DashboardOptions
) => {
  if (!user?.userId || !user?.role) {
    throw new ApiError(
      401,
      "Authentication required"
    );
  }

  switch (user.role) {
    case "SUPER_ADMIN":
    case "ADMIN":
      return getAdminDashboard(options);

    case "CLIENT":
      return getClientDashboard(
        user.userId,
        options
      );

    case "PROJECT_MANAGER":
      return getProjectManagerDashboard(
        user.userId,
        options
      );

    case "REVIEWER":
      return getReviewerDashboard(
        user.userId,
        options
      );

    case "CONTRIBUTOR":
      return getContributorDashboard(
        user.userId,
        options
      );

    default:
      throw new ApiError(
        403,
        "Dashboard access denied"
      );
  }
};